import "server-only";
import type { CoachingContext } from "./options";
import type { CoachingReport } from "./report";
import { analyzeWithClaude } from "./claude";

export type Frame = { t: number; jpegBase64: string };

export type ClipInput = CoachingContext & {
  seconds: number;
  frames: Frame[]; // sampled in the browser
  videoUrl: string; // temporary link to the full clip, for providers that watch video directly
};

export type ClipAnalysis = {
  report: CoachingReport;
  model: string;
  inputTokens: number;
  outputTokens: number;
};

/**
 * The one entry point the app uses for AI coaching. Swap the provider here
 * (e.g. to a model that takes the full video) without touching routes or UI.
 */
export function analyzeClip(input: ClipInput): Promise<ClipAnalysis> {
  return analyzeWithClaude(input);
}
