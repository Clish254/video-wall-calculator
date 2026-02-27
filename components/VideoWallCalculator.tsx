"use client";

import { useMemo, useReducer } from "react";
import GridVisualization from "@/components/GridVisualization";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { findGridResults } from "@/lib/calculator";
import { resolveGeometry, validateGeometry } from "@/lib/geometry";
import { convertValue, formatUnitValue, toMm } from "@/lib/units";
import { cn } from "@/lib/utils";
import type {
  AspectRatioPreset,
  CabinetSpec,
  CabinetTypeKey,
  DimensionKey,
  GeometryInput,
  GridCandidate,
  GridResultPair,
  SizeMetricKey,
  Unit,
} from "@/types";

const CABINETS: CabinetSpec[] = [
  {
    key: "sixteenByNine",
    label: "16:9 Cabinet",
    widthMm: 600,
    heightMm: 337.5,
    aspectRatio: 1.7778,
  },
  {
    key: "oneByOne",
    label: "1:1 Cabinet",
    widthMm: 500,
    heightMm: 500,
    aspectRatio: 1.0,
  },
];

const RATIO_PRESETS: AspectRatioPreset[] = [
  { label: "16:9", value: 1.7778 },
  { label: "32:9", value: 3.5556 },
  { label: "4:3", value: 1.3333 },
  { label: "24:9", value: 2.6667 },
  { label: "9:16", value: 0.5625 },
  { label: "16:10", value: 1.6 },
  { label: "2.40:1", value: 2.4 },
  { label: "16:18", value: 0.8889 },
  { label: "48:9", value: 5.3333 },
];

const UNITS: Unit[] = ["mm", "m", "ft", "in"];
const DIMENSION_KEYS: DimensionKey[] = ["width", "height", "diagonal"];

type CalculatorInputs = Record<DimensionKey, string>;

const EMPTY_INPUTS: CalculatorInputs = {
  width: "",
  height: "",
  diagonal: "",
};

type ActiveResultKey = "lower" | "upper";

type CalculatorState = {
  cabinetType: CabinetTypeKey;
  unit: Unit;
  inputs: CalculatorInputs;
  aspectRatioValue: number | null;
  errorMessage: string | null;
  results: GridResultPair | null;
  activeResult: ActiveResultKey;
};

type CalculatorAction =
  | { type: "setCabinetType"; value: CabinetTypeKey }
  | { type: "setUnit"; unit: Unit; inputs: CalculatorInputs }
  | { type: "setInput"; key: DimensionKey; value: string }
  | { type: "setAspectRatioValue"; value: number | null }
  | { type: "setError"; message: string | null }
  | { type: "applyResults"; results: GridResultPair }
  | { type: "setActiveResult"; value: ActiveResultKey }
  | { type: "clear" };

const INITIAL_STATE: CalculatorState = {
  cabinetType: "sixteenByNine",
  unit: "mm",
  inputs: EMPTY_INPUTS,
  aspectRatioValue: null,
  errorMessage: null,
  results: null,
  activeResult: "lower",
};

const sanitizeInput = (value: string): string => {
  const sanitized = value.replace(/[^0-9.]/g, "");
  const parts = sanitized.split(".");
  if (parts.length <= 2) return sanitized;
  return `${parts[0]}.${parts.slice(1).join("")}`;
};

const parseNumber = (value: string): number | null => {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatInputValue = (value: number): string => value.toFixed(2);

const resolveMetricKey = (
  activeDimensions: DimensionKey[],
  aspectRatioSelected: boolean,
): SizeMetricKey | null => {
  const hasWidth = activeDimensions.includes("width");
  const hasHeight = activeDimensions.includes("height");
  const hasDiagonal = activeDimensions.includes("diagonal");

  if (aspectRatioSelected) {
    if (hasWidth) return "width";
    if (hasHeight) return "height";
    if (hasDiagonal) return "diagonal";
  }

  if (hasWidth && hasHeight) return "widthHeight";
  if (hasWidth && hasDiagonal) return "widthDiagonal";
  if (hasHeight && hasDiagonal) return "heightDiagonal";

  return null;
};

const calculatorReducer = (
  state: CalculatorState,
  action: CalculatorAction,
): CalculatorState => {
  switch (action.type) {
    case "setCabinetType":
      return { ...state, cabinetType: action.value, errorMessage: null };
    case "setUnit":
      return {
        ...state,
        unit: action.unit,
        inputs: action.inputs,
        errorMessage: null,
      };
    case "setInput":
      return {
        ...state,
        inputs: { ...state.inputs, [action.key]: action.value },
        errorMessage: null,
      };
    case "setAspectRatioValue":
      return { ...state, aspectRatioValue: action.value, errorMessage: null };
    case "setError":
      return { ...state, errorMessage: action.message };
    case "applyResults":
      return {
        ...state,
        results: action.results,
        activeResult: "lower",
        errorMessage: null,
      };
    case "setActiveResult":
      return { ...state, activeResult: action.value };
    case "clear":
      return {
        ...state,
        inputs: { ...EMPTY_INPUTS },
        aspectRatioValue: null,
        errorMessage: null,
        results: null,
        activeResult: "lower",
      };
    default:
      return state;
  }
};

type ResultMetric = {
  label: string;
  value: string;
};

type ConfigurationCardProps = {
  cabinetType: CabinetTypeKey;
  unit: Unit;
  inputs: CalculatorInputs;
  aspectRatioValue: number | null;
  isLocked: boolean;
  activeCount: number;
  errorMessage: string | null;
  onCabinetTypeChange: (value: CabinetTypeKey) => void;
  onUnitChange: (value: Unit) => void;
  onAspectRatioChange: (value: number | null) => void;
  onInputChange: (key: DimensionKey, value: string) => void;
  onApply: () => void;
  onClear: () => void;
};

function ConfigurationCard({
  cabinetType,
  unit,
  inputs,
  aspectRatioValue,
  isLocked,
  activeCount,
  errorMessage,
  onCabinetTypeChange,
  onUnitChange,
  onAspectRatioChange,
  onInputChange,
  onApply,
  onClear,
}: ConfigurationCardProps) {
  return (
    <Card className="gap-0 border-white/10 bg-slate-900/65 shadow-2xl backdrop-blur-md">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base text-slate-100">
            Configuration Inputs
          </CardTitle>
          <Badge
            variant="outline"
            className="border-cyan-300/30 bg-cyan-300/10 text-[10px] uppercase tracking-[0.2em] text-cyan-100"
          >
            {Math.min(activeCount, 2)} of 2 selected
          </Badge>
        </div>
        <CardDescription className="text-slate-300/75">
          All controls stay in one row on desktop and wrap cleanly on small
          screens.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pb-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-[190px] flex-1 flex-col gap-2 lg:flex-none">
            <Label
              htmlFor="cabinet-type"
              className="text-xs uppercase tracking-[0.18em] text-slate-300"
            >
              Cabinet Type
            </Label>
            <Select value={cabinetType} onValueChange={onCabinetTypeChange}>
              <SelectTrigger
                id="cabinet-type"
                className="h-10 w-full border-white/15 bg-slate-950/70"
              >
                <SelectValue placeholder="Select cabinet" />
              </SelectTrigger>
              <SelectContent>
                {CABINETS.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label} ({option.widthMm} x {option.heightMm} mm)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex min-w-[190px] flex-1 flex-col gap-2 lg:flex-none">
            <Label className="text-xs uppercase tracking-[0.18em] text-slate-300">
              Units
            </Label>
            <ToggleGroup
              type="single"
              value={unit}
              onValueChange={(value) => {
                if (value) {
                  onUnitChange(value as Unit);
                }
              }}
              variant="outline"
              className="flex h-10 w-full bg-transparent p-0"
            >
              {UNITS.map((unitOption) => (
                <ToggleGroupItem
                  key={unitOption}
                  value={unitOption}
                  className="h-8 flex-1 rounded-sm text-xs uppercase tracking-[0.14em]"
                >
                  {unitOption}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="flex min-w-[190px] flex-1 flex-col gap-2 lg:flex-none">
            <Label
              htmlFor="aspect-ratio"
              className="text-xs uppercase tracking-[0.18em] text-slate-300"
            >
              Aspect Ratio
            </Label>
            <Select
              value={aspectRatioValue ? String(aspectRatioValue) : ""}
              disabled={!aspectRatioValue && isLocked}
              onValueChange={(value) => {
                onAspectRatioChange(value ? Number(value) : null);
              }}
            >
              <SelectTrigger
                id="aspect-ratio"
                className="h-10 w-full border-white/15 bg-slate-950/70 disabled:opacity-50"
              >
                <SelectValue placeholder="Select ratio" />
              </SelectTrigger>
              <SelectContent>
                {RATIO_PRESETS.map((option) => (
                  <SelectItem key={option.label} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {DIMENSION_KEYS.map((key) => (
            <div
              key={key}
              className="flex min-w-[165px] flex-1 flex-col gap-2 lg:flex-none"
            >
              <Label
                htmlFor={key}
                className="text-xs uppercase tracking-[0.18em] text-slate-300"
              >
                {key}
              </Label>
              <div className="relative">
                <Input
                  id={key}
                  inputMode="decimal"
                  value={inputs[key]}
                  disabled={!inputs[key] && isLocked}
                  onChange={(event) => {
                    onInputChange(key, sanitizeInput(event.target.value));
                  }}
                  placeholder="0"
                  className={cn(
                    "h-10 border-white/15 bg-slate-950/70 pr-11 text-sm",
                    !inputs[key] && isLocked && "cursor-not-allowed opacity-50",
                  )}
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] uppercase tracking-[0.12em] text-slate-400">
                  {unit}
                </span>
              </div>
            </div>
          ))}

          <Button
            type="button"
            onClick={onApply}
            className="h-10 min-w-[108px] bg-cyan-300 text-slate-950 hover:bg-cyan-200"
          >
            Apply
          </Button>
          <Button
            type="button"
            onClick={onClear}
            variant="outline"
            className="h-10 min-w-[108px] border-white/20 bg-transparent text-slate-200 hover:bg-white/10"
          >
            Clear
          </Button>
        </div>

        <Separator className="bg-white/10" />

        <p className="text-xs text-slate-300/70">
          Once two parameters are active, remaining fields are locked until you
          clear one.
        </p>

        {errorMessage && (
          <Alert
            variant="destructive"
            className="border-rose-400/40 bg-rose-400/10 text-rose-100"
          >
            <AlertTitle>Input error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

type PreviewCardProps = {
  results: GridResultPair | null;
  activeResult: ActiveResultKey;
  activeCandidate: GridCandidate | null;
  widthMeasurement: string | null;
  heightMeasurement: string | null;
  onActiveResultChange: (value: ActiveResultKey) => void;
};

function PreviewCard({
  results,
  activeResult,
  activeCandidate,
  widthMeasurement,
  heightMeasurement,
  onActiveResultChange,
}: PreviewCardProps) {
  return (
    <Card className="gap-0 border-white/10 bg-slate-900/65 shadow-2xl backdrop-blur-md">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base text-slate-100">
            Video Wall Preview
          </CardTitle>
          <Badge
            variant="outline"
            className="border-slate-400/30 bg-slate-500/10 text-slate-200"
          >
            {results ? `${activeResult.toUpperCase()} ACTIVE` : "NO RESULT"}
          </Badge>
        </div>
        <CardDescription className="text-slate-300/75">
          Toggle lower or upper from the top-center control to switch active
          result output.
        </CardDescription>
      </CardHeader>
      <CardContent className="relative pt-14 pb-6">
        <div className="absolute top-2 left-1/2 z-20 -translate-x-1/2">
          <ToggleGroup
            type="single"
            value={activeResult}
            onValueChange={(value) => {
              if (value === "lower" || value === "upper") {
                onActiveResultChange(value);
              }
            }}
            variant="outline"
            className="bg-transparent p-0"
          >
            <ToggleGroupItem
              value="lower"
              disabled={!results}
              className="h-8 rounded-full px-4 text-xs uppercase tracking-[0.14em]"
            >
              Lower
            </ToggleGroupItem>
            <ToggleGroupItem
              value="upper"
              disabled={!results}
              className="h-8 rounded-full px-4 text-xs uppercase tracking-[0.14em]"
            >
              Upper
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="mx-auto w-full max-w-[980px]">
          <GridVisualization
            candidate={activeCandidate}
            showVideo={Boolean(activeCandidate)}
            resultLabel={activeResult}
            widthMeasurement={widthMeasurement}
            heightMeasurement={heightMeasurement}
          />
        </div>
      </CardContent>
    </Card>
  );
}

type ResultsCardProps = {
  results: GridResultPair | null;
  activeResult: ActiveResultKey;
  activeCandidate: GridCandidate | null;
  resultMetrics: ResultMetric[];
};

function ResultsCard({
  results,
  activeResult,
  activeCandidate,
  resultMetrics,
}: ResultsCardProps) {
  return (
    <Card className="gap-0 border-white/10 bg-slate-900/65 shadow-2xl backdrop-blur-md">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base text-slate-100">
            Resulting Configuration
          </CardTitle>
          <Badge
            variant="outline"
            className="border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
          >
            {results ? activeResult : "pending"}
          </Badge>
        </div>
        <CardDescription className="text-slate-300/75">
          Final output values for the currently active result.
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-6">
        {!activeCandidate ? (
          <div className="rounded-xl border border-dashed border-white/15 bg-slate-950/45 p-6 text-center text-sm text-slate-300/75">
            Apply inputs above to generate the final configuration metrics.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {resultMetrics.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/15 bg-slate-950/60 p-3 shadow-[0_10px_28px_-18px_rgba(6,182,212,0.6)]"
              >
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  {item.label}
                </div>
                <div className="mt-2 text-base font-semibold text-slate-100">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function VideoWallCalculator() {
  const [state, dispatch] = useReducer(calculatorReducer, INITIAL_STATE);

  const {
    cabinetType,
    unit,
    inputs,
    aspectRatioValue,
    errorMessage,
    results,
    activeResult,
  } = state;

  const activeDimensions = useMemo(
    () => DIMENSION_KEYS.filter((key) => inputs[key].trim() !== ""),
    [inputs],
  );

  const activeCount = activeDimensions.length + (aspectRatioValue ? 1 : 0);
  const isLocked = activeCount >= 2;

  const cabinet = useMemo(
    () => CABINETS.find((item) => item.key === cabinetType) ?? CABINETS[0],
    [cabinetType],
  );

  const activeCandidate = results ? results[activeResult] : null;

  const widthMeasurement = activeCandidate
    ? `${formatUnitValue(activeCandidate.widthMm, unit)} ${unit}`
    : null;

  const heightMeasurement = activeCandidate
    ? `${formatUnitValue(activeCandidate.heightMm, unit)} ${unit}`
    : null;

  const resultMetrics: ResultMetric[] = activeCandidate
    ? [
        { label: "Number of columns", value: String(activeCandidate.cols) },
        { label: "Number of rows", value: String(activeCandidate.rows) },
        {
          label: "Total cabinet count",
          value: String(activeCandidate.cabinetCount),
        },
        {
          label: "Final width",
          value: `${formatUnitValue(activeCandidate.widthMm, unit)} ${unit}`,
        },
        {
          label: "Final height",
          value: `${formatUnitValue(activeCandidate.heightMm, unit)} ${unit}`,
        },
        {
          label: "Final diagonal",
          value: `${formatUnitValue(activeCandidate.diagonalMm, unit)} ${unit}`,
        },
        {
          label: "Final aspect ratio",
          value: activeCandidate.aspectRatio.toFixed(4),
        },
      ]
    : [];

  const handleUnitChange = (nextUnit: Unit) => {
    if (nextUnit === unit) return;

    const nextInputs = DIMENSION_KEYS.reduce<CalculatorInputs>((acc, key) => {
      const numericValue = parseNumber(inputs[key]);
      acc[key] =
        numericValue === null
          ? inputs[key]
          : formatInputValue(convertValue(numericValue, unit, nextUnit));
      return acc;
    }, { ...inputs });

    dispatch({ type: "setUnit", unit: nextUnit, inputs: nextInputs });
  };

  const handleApply = () => {
    if (activeCount !== 2) {
      dispatch({
        type: "setError",
        message: "Select exactly two parameters before applying.",
      });
      return;
    }

    const widthInput = parseNumber(inputs.width);
    const heightInput = parseNumber(inputs.height);
    const diagonalInput = parseNumber(inputs.diagonal);

    const widthMm = widthInput !== null ? toMm(widthInput, unit) : undefined;
    const heightMm = heightInput !== null ? toMm(heightInput, unit) : undefined;
    const diagonalMm =
      diagonalInput !== null ? toMm(diagonalInput, unit) : undefined;

    const geometryInput: GeometryInput = {
      widthMm,
      heightMm,
      diagonalMm,
      aspectRatio: aspectRatioValue ?? undefined,
    };

    const geometryError = validateGeometry(geometryInput);
    if (geometryError) {
      dispatch({ type: "setError", message: geometryError });
      return;
    }

    const metricKey = resolveMetricKey(
      activeDimensions,
      Boolean(aspectRatioValue),
    );

    if (!metricKey) {
      dispatch({
        type: "setError",
        message: "Choose a valid combination of two parameters.",
      });
      return;
    }

    const geometryResult = resolveGeometry(geometryInput);
    const nextResults = findGridResults(cabinet, geometryResult, metricKey);

    dispatch({ type: "applyResults", results: nextResults });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(8,145,178,0.24),_transparent_48%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.92),_transparent_68%),linear-gradient(150deg,_#020617,_#030712_42%,_#0b1120_100%)] text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:90px_90px] opacity-40" />

      <main className="relative mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-6 sm:px-6 md:px-8 md:py-10">
        <header className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/70">
            Video Wall Tool
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-100 md:text-4xl">
            Video Wall Calculator
          </h1>
          <p className="max-w-3xl text-sm text-slate-300/80">
            Configure exactly two inputs, apply, and compare lower or upper
            cabinet outcomes directly on a centered wall preview.
          </p>
        </header>

        <ConfigurationCard
          cabinetType={cabinetType}
          unit={unit}
          inputs={inputs}
          aspectRatioValue={aspectRatioValue}
          isLocked={isLocked}
          activeCount={activeCount}
          errorMessage={errorMessage}
          onCabinetTypeChange={(value) => {
            dispatch({ type: "setCabinetType", value });
          }}
          onUnitChange={handleUnitChange}
          onAspectRatioChange={(value) => {
            dispatch({ type: "setAspectRatioValue", value });
          }}
          onInputChange={(key, value) => {
            dispatch({ type: "setInput", key, value });
          }}
          onApply={handleApply}
          onClear={() => {
            dispatch({ type: "clear" });
          }}
        />

        <PreviewCard
          results={results}
          activeResult={activeResult}
          activeCandidate={activeCandidate}
          widthMeasurement={widthMeasurement}
          heightMeasurement={heightMeasurement}
          onActiveResultChange={(value) => {
            dispatch({ type: "setActiveResult", value });
          }}
        />

        <ResultsCard
          results={results}
          activeResult={activeResult}
          activeCandidate={activeCandidate}
          resultMetrics={resultMetrics}
        />
      </main>
    </div>
  );
}
