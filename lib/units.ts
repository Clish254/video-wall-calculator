// Unit conversion utilities (doc.pdf). Internal calculations remain in millimeters.
import type { Unit } from "@/types";

const MM_PER_METER = 1000;
const MM_PER_INCH = 25.4;
const MM_PER_FOOT = 304.8;

export const toMm = (value: number, unit: Unit): number => {
  if (!Number.isFinite(value)) return NaN;
  switch (unit) {
    case "mm":
      return value;
    case "m":
      return value * MM_PER_METER;
    case "in":
      return value * MM_PER_INCH;
    case "ft":
      return value * MM_PER_FOOT;
    default:
      return value;
  }
};

export const fromMm = (valueMm: number, unit: Unit): number => {
  if (!Number.isFinite(valueMm)) return NaN;
  switch (unit) {
    case "mm":
      return valueMm;
    case "m":
      return valueMm / MM_PER_METER;
    case "in":
      return valueMm / MM_PER_INCH;
    case "ft":
      return valueMm / MM_PER_FOOT;
    default:
      return valueMm;
  }
};

export const convertValue = (value: number, fromUnit: Unit, toUnit: Unit): number =>
  fromMm(toMm(value, fromUnit), toUnit);

export const formatUnitValue = (valueMm: number, unit: Unit, decimals = 2): string => {
  const value = fromMm(valueMm, unit);
  if (!Number.isFinite(value)) return "–";
  return value.toFixed(decimals);
};
