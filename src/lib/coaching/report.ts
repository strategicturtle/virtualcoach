import { z } from "zod";

// The structured feedback the coach returns. Stored as JSON on Analysis.report.
export const CoachingReportSchema = z.object({
  skillObserved: z.string().describe("What the player appears to be practicing in the clip."),
  summary: z.string().describe("2-3 sentence overall assessment, addressed to the player."),
  overallScore: z.number().describe("Overall technique score from 1 to 10."),
  strengths: z.array(z.string()).describe("2-4 specific things the player is doing well."),
  breakdown: z
    .array(
      z.object({
        area: z.string().describe("Part of the technique, e.g. Stance, Hand position, Footwork."),
        score: z.number().describe("Score for this area from 1 to 10."),
        observation: z.string().describe("What you saw, citing frame timestamps like (at 3.5s)."),
        howToImprove: z.string().describe("Concrete coaching cues to fix or refine it."),
        drill: z.object({
          name: z.string(),
          instructions: z.string().describe("How to do the drill, including reps or time."),
        }),
      }),
    )
    .describe("4-7 areas of the technique, most important first."),
  topPriorities: z.array(z.string()).describe("The 3 most important changes, in order."),
  limitations: z
    .string()
    .nullable()
    .describe("Anything that limited the analysis (camera angle, blur, player out of frame), or null."),
});

export type CoachingReport = z.infer<typeof CoachingReportSchema>;

export function clampScore(n: number) {
  return Math.min(10, Math.max(1, Math.round(n)));
}
