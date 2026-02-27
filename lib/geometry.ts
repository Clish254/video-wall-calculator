// Geometry resolution based on doc.pdf combinations.
import type { GeometryInput, GeometryResult } from "@/types";

const square = (value: number) => value * value;

export const validateGeometry = (input: GeometryInput): string | null => {
  const { widthMm, heightMm, diagonalMm, aspectRatio } = input;

  if (widthMm !== undefined && widthMm <= 0) return "Width must be greater than 0.";
  if (heightMm !== undefined && heightMm <= 0) return "Height must be greater than 0.";
  if (diagonalMm !== undefined && diagonalMm <= 0) return "Diagonal must be greater than 0.";
  if (aspectRatio !== undefined && aspectRatio <= 0) return "Aspect ratio must be greater than 0.";

  if (widthMm !== undefined && diagonalMm !== undefined && diagonalMm <= widthMm) {
    return "Diagonal must be larger than width.";
  }
  if (heightMm !== undefined && diagonalMm !== undefined && diagonalMm <= heightMm) {
    return "Diagonal must be larger than height.";
  }

  return null;
};

export const resolveGeometry = (input: GeometryInput): GeometryResult => {
  const { widthMm, heightMm, diagonalMm, aspectRatio } = input;

  if (aspectRatio !== undefined && heightMm !== undefined) {
    const resolvedWidth = heightMm * aspectRatio;
    const resolvedDiagonal = Math.hypot(resolvedWidth, heightMm);
    return {
      widthMm: resolvedWidth,
      heightMm,
      diagonalMm: resolvedDiagonal,
      aspectRatio,
    };
  }

  if (aspectRatio !== undefined && widthMm !== undefined) {
    const resolvedHeight = widthMm / aspectRatio;
    const resolvedDiagonal = Math.hypot(widthMm, resolvedHeight);
    return {
      widthMm,
      heightMm: resolvedHeight,
      diagonalMm: resolvedDiagonal,
      aspectRatio,
    };
  }

  if (aspectRatio !== undefined && diagonalMm !== undefined) {
    const resolvedHeight = diagonalMm / Math.sqrt(square(aspectRatio) + 1);
    const resolvedWidth = resolvedHeight * aspectRatio;
    return {
      widthMm: resolvedWidth,
      heightMm: resolvedHeight,
      diagonalMm,
      aspectRatio,
    };
  }

  if (widthMm !== undefined && heightMm !== undefined) {
    const resolvedDiagonal = Math.hypot(widthMm, heightMm);
    const ratio = widthMm / heightMm;
    return {
      widthMm,
      heightMm,
      diagonalMm: resolvedDiagonal,
      aspectRatio: ratio,
    };
  }

  if (heightMm !== undefined && diagonalMm !== undefined) {
    const resolvedWidth = Math.sqrt(square(diagonalMm) - square(heightMm));
    const ratio = resolvedWidth / heightMm;
    return {
      widthMm: resolvedWidth,
      heightMm,
      diagonalMm,
      aspectRatio: ratio,
    };
  }

  if (widthMm !== undefined && diagonalMm !== undefined) {
    const resolvedHeight = Math.sqrt(square(diagonalMm) - square(widthMm));
    const ratio = widthMm / resolvedHeight;
    return {
      widthMm,
      heightMm: resolvedHeight,
      diagonalMm,
      aspectRatio: ratio,
    };
  }

  return {
    widthMm: 0,
    heightMm: 0,
    diagonalMm: 0,
    aspectRatio: 0,
  };
};
