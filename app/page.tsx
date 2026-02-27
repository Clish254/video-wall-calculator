import type { Metadata } from "next";
import VideoWallCalculator from "@/components/VideoWallCalculator";

export const metadata: Metadata = {
  title: "Video Wall Calculator",
  description: "Plan LED cabinet dimensions with lower and upper grid suggestions.",
};

export default function Home() {
  return <VideoWallCalculator />;
}
