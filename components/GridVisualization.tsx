import type { GridCandidate } from "@/types";

type GridVisualizationProps = {
  candidate: GridCandidate | null;
  showVideo: boolean;
  widthMeasurement: string | null;
  heightMeasurement: string | null;
};

export default function GridVisualization({
  candidate,
  showVideo,
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
    <div className="w-full">
      <div className="flex items-center gap-2 sm:gap-4">
        {heightMeasurement && (
          <div className="pointer-events-none rounded-full border border-white/25 bg-slate-950/70 px-3 py-1 text-xs font-medium text-slate-100 backdrop-blur-sm -rotate-90">
            Height {heightMeasurement}
          </div>
        )}

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
          <div
            className="absolute inset-0 opacity-80 mix-blend-screen"
            style={gridStyle}
          />

        </div>
      </div>

      {widthMeasurement && (
        <div className="mt-3 flex justify-center">
          <div className="pointer-events-none rounded-full border border-white/25 bg-slate-950/70 px-3 py-1 text-xs font-medium text-slate-100 backdrop-blur-sm">
            Width {widthMeasurement}
          </div>
        </div>
      )}
    </div>
  );
}
