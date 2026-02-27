// Types derived from the requirements in doc.pdf.
export type Unit = "mm" | "m" | "ft" | "in";

export type CabinetTypeKey = "sixteenByNine" | "oneByOne";

export type CabinetSpec = {
  key: CabinetTypeKey;
  label: string;
  widthMm: number;
  heightMm: number;
  aspectRatio: number;
};

export type AspectRatioPreset = {
  label: string;
  value: number;
};

export type DimensionKey = "width" | "height" | "diagonal";

export type GeometryInput = {
  widthMm?: number;
  heightMm?: number;
  diagonalMm?: number;
  aspectRatio?: number;
};

export type GeometryResult = {
  widthMm: number;
  heightMm: number;
  diagonalMm: number;
  aspectRatio: number;
};

export type GridCandidate = {
  cols: number;
  rows: number;
  widthMm: number;
  heightMm: number;
  diagonalMm: number;
  aspectRatio: number;
  cabinetCount: number;
  sizeError: number;
  ratioError: number;
};

export type GridResultPair = {
  lower: GridCandidate;
  upper: GridCandidate;
};

export type SizeMetricKey = "width" | "height" | "diagonal" | "widthHeight" | "widthDiagonal" | "heightDiagonal";
