import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { ClipAnalysis, ClipInput } from "./index";
import { CoachingReportSchema } from "./report";

const MODEL = "claude-opus-5";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY

const SYSTEM = `You are VirtualCoach, an experienced lacrosse coach reviewing a player's practice clip.

You receive still frames sampled in order from a short video, each labeled with its timestamp. Treat them as a sequence: reason about the motion between frames, not just each pose in isolation. Frames are a few tenths of a second to a couple of seconds apart, so fast moments (a release, a catch) may fall between frames; say so when it matters instead of guessing.

Coach the specific player in front of you:
- Tailor the breakdown areas to the skill (e.g. shooting: stance, hand spacing, stick lift/windup, hip and shoulder rotation, release point, follow-through; goalie: ready stance, stick and hand position, step to the ball, rebound control).
- Pitch your language and drills to the player's stated level and position.
- Be encouraging but honest. Every observation must be grounded in something visible in the frames; cite timestamps like (at 3.5s).
- Drills must be doable alone or with a wall/partner, with clear reps or time.
- If the clip doesn't show lacrosse, or the player is too small, blurry, or out of frame to judge something, say so in limitations and score only what you can see.
- Scores are 1-10, where 5 is typical for the stated level.`;

export async function analyzeWithClaude(input: ClipInput): Promise<ClipAnalysis> {
  const content: Anthropic.Beta.BetaContentBlockParam[] = [
    {
      type: "text",
      text: `Player context:
- Practicing: ${input.skill}
- Position: ${input.position}
- Level: ${input.level}
- Clip length: ${input.seconds}s, ${input.frames.length} frames follow.`,
    },
  ];
  for (const frame of input.frames) {
    content.push({ type: "text", text: `Frame at ${frame.t.toFixed(1)}s` });
    content.push({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: frame.jpegBase64 },
    });
  }
  content.push({
    type: "text",
    text: "Give this player a detailed technique breakdown with scores, fixes, and drills.",
  });

  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default", // rerun on Anthropic's recommended model if a safety classifier declines
    thinking: { type: "adaptive" },
    output_config: { effort: "high", format: betaZodOutputFormat(CoachingReportSchema) },
    system: SYSTEM,
    messages: [{ role: "user", content }],
  });

  if (response.stop_reason === "refusal") {
    throw new CoachingError("The coach couldn't review this clip. Try a different video.");
  }
  if (response.stop_reason === "max_tokens" || !response.parsed_output) {
    throw new CoachingError("The coach's report came back incomplete. Try again.");
  }

  return {
    report: response.parsed_output,
    model: response.model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

/** An error whose message is safe to show the player. */
export class CoachingError extends Error {}
