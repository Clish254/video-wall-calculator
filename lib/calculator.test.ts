import { describe, expect, test } from "bun:test";

import { findGridResults } from "@/lib/calculator";
import { resolveGeometry } from "@/lib/geometry";
import { fromMm, toMm } from "@/lib/units";
import type { CabinetSpec } from "@/types";

const SIXTEEN_BY_NINE_CABINET: CabinetSpec = {
  key: "sixteenByNine",
  label: "16:9 Cabinet",
  widthMm: 600,
  heightMm: 337.5,
  aspectRatio: 1.7778,
};

describe("Scenario 1: 16:9 ratio with 100-inch height", () => {
  test("converts 100 inches to millimeters", () => {
    expect(toMm(100, "in")).toBeCloseTo(2540, 10);
  });

  test("returns closest lower and upper configurations with ratio-aware selection", () => {
    const target = resolveGeometry({
      heightMm: toMm(100, "in"),
      aspectRatio: 16 / 9,
    });

    const result = findGridResults(SIXTEEN_BY_NINE_CABINET, target, "height");

    expect(result.lower.cols).toBe(7);
    expect(result.lower.rows).toBe(7);
    expect(result.lower.cabinetCount).toBe(49);
    expect(fromMm(result.lower.heightMm, "in")).toBeCloseTo(93.01, 2);
    expect(result.lower.aspectRatio).toBeCloseTo(16 / 9, 4);
    expect(result.lower.heightMm).toBeLessThanOrEqual(target.heightMm);

    expect(result.upper.cols).toBe(8);
    expect(result.upper.rows).toBe(8);
    expect(result.upper.cabinetCount).toBe(64);
    expect(fromMm(result.upper.heightMm, "in")).toBeCloseTo(106.3, 1);
    expect(result.upper.aspectRatio).toBeCloseTo(16 / 9, 4);
    expect(result.upper.heightMm).toBeGreaterThanOrEqual(target.heightMm);
  });
});

describe("Ranking and fallback regressions", () => {
  test("exact size match is lower and upper is the next larger candidate", () => {
    const target = resolveGeometry({
      heightMm: 2700,
      aspectRatio: 16 / 9,
    });

    const result = findGridResults(SIXTEEN_BY_NINE_CABINET, target, "height");

    expect(result.lower.rows).toBe(8);
    expect(result.lower.sizeError).toBe(0);
    expect(result.upper.rows).toBe(9);
    expect(result.upper.heightMm).toBeGreaterThan(result.lower.heightMm);
  });

  test("two-dim width+diagonal fallback returns distinct lower and upper candidates", () => {
    const target = resolveGeometry({
      widthMm: 500,
      diagonalMm: 1000,
    });

    const result = findGridResults(SIXTEEN_BY_NINE_CABINET, target, "widthDiagonal");
    const lowerKey = `${result.lower.cols}x${result.lower.rows}`;
    const upperKey = `${result.upper.cols}x${result.upper.rows}`;

    expect(lowerKey).not.toBe(upperKey);
    expect(result.lower.widthMm).toBeGreaterThan(target.widthMm);
    expect(result.lower.diagonalMm).toBeLessThan(target.diagonalMm);
    expect(result.upper.widthMm).toBeGreaterThanOrEqual(target.widthMm);
    expect(result.upper.diagonalMm).toBeGreaterThanOrEqual(target.diagonalMm);
  });

  test("9:16 targets prioritize smaller size error before ratio error", () => {
    const target = resolveGeometry({
      heightMm: 2700,
      aspectRatio: 9 / 16,
    });

    const result = findGridResults(SIXTEEN_BY_NINE_CABINET, target, "height");

    expect(result.lower.cols).toBe(3);
    expect(result.lower.rows).toBe(8);
    expect(result.lower.sizeError).toBe(0);
  });

  test("findGridResults signature and return shape stay unchanged", () => {
    expect(findGridResults.length).toBe(3);

    const target = resolveGeometry({
      heightMm: 2700,
      aspectRatio: 16 / 9,
    });
    const result = findGridResults(SIXTEEN_BY_NINE_CABINET, target, "height");

    expect(result).toHaveProperty("lower");
    expect(result).toHaveProperty("upper");
  });
});
