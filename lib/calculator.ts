// Cabinet grid search based on doc.pdf logic.
import type {
  CabinetSpec,
  GeometryResult,
  GridCandidate,
  GridResultPair,
  SizeMetricKey,
} from "@/types";

const MAX_GRID = 150;

const SCORE_EPSILON = 1e-9;
const EXACT_EPSILON = 1e-4;

const clampCandidate = (
  candidates: GridCandidate[],
  preferMore: boolean,
): GridCandidate | null => {
  if (candidates.length === 0) return null;
  return candidates.reduce((best, next) => {
    if (!best) return next;
    if (next.sizeError + SCORE_EPSILON < best.sizeError) return next;
    if (best.sizeError + SCORE_EPSILON < next.sizeError) return best;
    if (next.ratioError + SCORE_EPSILON < best.ratioError) return next;
    if (best.ratioError + SCORE_EPSILON < next.ratioError) return best;
    if (preferMore) {
      return next.cabinetCount >= best.cabinetCount ? next : best;
    }
    return next.cabinetCount <= best.cabinetCount ? next : best;
  }, candidates[0]);
};

const isExactSizeMatch = (candidate: GridCandidate): boolean => candidate.sizeError <= EXACT_EPSILON;

const getTargetRatio = (geometry: GeometryResult): number => geometry.aspectRatio;

const calcSizeError = (
  metricKey: SizeMetricKey,
  candidate: GridCandidate,
  target: GeometryResult,
): number => {
  switch (metricKey) {
    case "width":
      return Math.abs(candidate.widthMm - target.widthMm);
    case "height":
      return Math.abs(candidate.heightMm - target.heightMm);
    case "diagonal":
      return Math.abs(candidate.diagonalMm - target.diagonalMm);
    case "widthHeight":
      return Math.hypot(candidate.widthMm - target.widthMm, candidate.heightMm - target.heightMm);
    case "widthDiagonal":
      return Math.hypot(candidate.widthMm - target.widthMm, candidate.diagonalMm - target.diagonalMm);
    case "heightDiagonal":
      return Math.hypot(candidate.heightMm - target.heightMm, candidate.diagonalMm - target.diagonalMm);
    default:
      return Math.abs(candidate.widthMm - target.widthMm);
  }
};

const qualifiesLower = (metricKey: SizeMetricKey, candidate: GridCandidate, target: GeometryResult): boolean => {
  switch (metricKey) {
    case "width":
      return candidate.widthMm <= target.widthMm;
    case "height":
      return candidate.heightMm <= target.heightMm;
    case "diagonal":
      return candidate.diagonalMm <= target.diagonalMm;
    case "widthHeight":
      return candidate.widthMm <= target.widthMm && candidate.heightMm <= target.heightMm;
    case "widthDiagonal":
      return candidate.widthMm <= target.widthMm && candidate.diagonalMm <= target.diagonalMm;
    case "heightDiagonal":
      return candidate.heightMm <= target.heightMm && candidate.diagonalMm <= target.diagonalMm;
    default:
      return false;
  }
};

const qualifiesUpper = (metricKey: SizeMetricKey, candidate: GridCandidate, target: GeometryResult): boolean => {
  switch (metricKey) {
    case "width":
      return candidate.widthMm >= target.widthMm;
    case "height":
      return candidate.heightMm >= target.heightMm;
    case "diagonal":
      return candidate.diagonalMm >= target.diagonalMm;
    case "widthHeight":
      return candidate.widthMm >= target.widthMm && candidate.heightMm >= target.heightMm;
    case "widthDiagonal":
      return candidate.widthMm >= target.widthMm && candidate.diagonalMm >= target.diagonalMm;
    case "heightDiagonal":
      return candidate.heightMm >= target.heightMm && candidate.diagonalMm >= target.diagonalMm;
    default:
      return false;
  }
};

const buildCandidate = (
  cabinet: CabinetSpec,
  cols: number,
  rows: number,
  target: GeometryResult,
  metricKey: SizeMetricKey,
): GridCandidate => {
  const widthMm = cols * cabinet.widthMm;
  const heightMm = rows * cabinet.heightMm;
  const diagonalMm = Math.hypot(widthMm, heightMm);
  const aspectRatio = widthMm / heightMm;
  const sizeError = calcSizeError(
    metricKey,
    {
      cols,
      rows,
      widthMm,
      heightMm,
      diagonalMm,
      aspectRatio,
      cabinetCount: cols * rows,
      sizeError: 0,
      ratioError: 0,
    },
    target,
  );
  const targetRatio = getTargetRatio(target);
  const ratioError = Math.abs(aspectRatio - targetRatio);

  return {
    cols,
    rows,
    widthMm,
    heightMm,
    diagonalMm,
    aspectRatio,
    cabinetCount: cols * rows,
    sizeError,
    ratioError,
  };
};

export const findGridResults = (
  cabinet: CabinetSpec,
  target: GeometryResult,
  metricKey: SizeMetricKey,
): GridResultPair => {
  const lowerCandidates: GridCandidate[] = [];
  const upperCandidates: GridCandidate[] = [];
  const allCandidates: GridCandidate[] = [];
  const isTwoDimMetric =
    metricKey === "widthHeight" || metricKey === "widthDiagonal" || metricKey === "heightDiagonal";

  for (let cols = 1; cols <= MAX_GRID; cols += 1) {
    for (let rows = 1; rows <= MAX_GRID; rows += 1) {
      const candidate = buildCandidate(cabinet, cols, rows, target, metricKey);
      allCandidates.push(candidate);
      if (qualifiesLower(metricKey, candidate, target)) {
        lowerCandidates.push(candidate);
      }
      if (qualifiesUpper(metricKey, candidate, target)) {
        upperCandidates.push(candidate);
      }
    }
  }

  if (isTwoDimMetric) {
    // For two-dimension targets, strict all-dims <=/>= can be empty on one side.
    // Relax to candidates where at least one provided dimension is on that side.
    if (lowerCandidates.length === 0) {
      for (const candidate of allCandidates) {
        const matchesLower =
          (metricKey === "widthHeight" &&
            (candidate.widthMm <= target.widthMm || candidate.heightMm <= target.heightMm)) ||
          (metricKey === "widthDiagonal" &&
            (candidate.widthMm <= target.widthMm || candidate.diagonalMm <= target.diagonalMm)) ||
          (metricKey === "heightDiagonal" &&
            (candidate.heightMm <= target.heightMm || candidate.diagonalMm <= target.diagonalMm));
        if (matchesLower) {
          lowerCandidates.push(candidate);
        }
      }
    }

    if (upperCandidates.length === 0) {
      for (const candidate of allCandidates) {
        const matchesUpper =
          (metricKey === "widthHeight" &&
            (candidate.widthMm >= target.widthMm || candidate.heightMm >= target.heightMm)) ||
          (metricKey === "widthDiagonal" &&
            (candidate.widthMm >= target.widthMm || candidate.diagonalMm >= target.diagonalMm)) ||
          (metricKey === "heightDiagonal" &&
            (candidate.heightMm >= target.heightMm || candidate.diagonalMm >= target.diagonalMm));
        if (matchesUpper) {
          upperCandidates.push(candidate);
        }
      }
    }
  }

  let lower = clampCandidate(lowerCandidates, false);
  let upper = clampCandidate(upperCandidates, true);

  if (lower && upper) {
    if (isExactSizeMatch(lower)) {
      const filteredUpper = upperCandidates.filter((candidate) => !isExactSizeMatch(candidate));
      upper = clampCandidate(filteredUpper, true) ?? upper;
    }
  }

  if (!lower) {
    lower = clampCandidate(allCandidates, false) ?? allCandidates[0];
  }

  if (!upper) {
    upper = clampCandidate(allCandidates, true) ?? allCandidates[allCandidates.length - 1];
  }

  return { lower, upper };
};
