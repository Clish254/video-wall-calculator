import type { GridCandidate } from "@/types";

type GridVisualizationProps = {
  candidate: GridCandidate | null;
  showVideo: boolean;
  resultLabel: "lower" | "upper";
  widthMeasurement: string | null;
  heightMeasurement: string | null;
};

export default function GridVisualization({
  candidate,
  showVideo,
  resultLabel,
  widthMeasurement,
  heightMeasurement,
}: GridVisualizationProps) {
  if (!showVideo || !candidate) {
    return (
      <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border/70 bg-card/40">
        <div className="text-center">
          <p className="text-sm font-medium text-foreground/90">Video wall preview appears after Apply</p>
          <p className="mt-1 text-xs uppercase tracking-[0.24em] text-muted-foreground">
            Configure two parameters to generate a wall
          </p>
        </div>
      </div>
    );
  }

  const gridStyle = {
    backgroundImage:
      "linear-gradient(to right, rgba(248,250,252,0.32) 1px, transparent 1px), linear-gradient(to bottom, rgba(248,250,252,0.32) 1px, transparent 1px)",
    backgroundSize: `calc(100% / ${candidate.cols}) calc(100% / ${candidate.rows})`,
  } as const;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/15 bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/bugatti.mp4"
        autoPlay
        loop
        muted
        playsInline
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.22),transparent_55%),linear-gradient(to_bottom,rgba(2,6,23,0.2),rgba(2,6,23,0.55))]" />
      <div className="absolute inset-0 opacity-80 mix-blend-screen" style={gridStyle} />

      <div className="pointer-events-none absolute right-4 top-4 rounded-full border border-white/25 bg-slate-950/55 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.26em] text-slate-200">
        {resultLabel} result
      </div>

      {widthMeasurement && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-white/25 bg-slate-950/70 px-3 py-1 text-xs font-medium text-slate-100 backdrop-blur-sm">
          Width {widthMeasurement}
        </div>
      )}

      {heightMeasurement && (
        <div className="pointer-events-none absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 rounded-full border border-white/25 bg-slate-950/70 px-3 py-1 text-xs font-medium text-slate-100 backdrop-blur-sm">
          Height {heightMeasurement}
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
        <div className="rounded-full border border-white/20 bg-slate-950/65 px-4 py-2 text-xs uppercase tracking-[0.26em] text-slate-100">
          {candidate.cols} x {candidate.rows}
        </div>
      </div>
    </div>
  );
}
