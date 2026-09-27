// Choices on the coaching form. Shared by the client form and server validation.

export const SKILLS = [
  "Shooting",
  "Passing",
  "Catching",
  "Cradling",
  "Dodging",
  "Ground balls",
  "Face-offs",
  "Defense",
  "Goalie saves",
  "Other",
] as const;

export const POSITIONS = ["Attack", "Midfield", "Defense", "Goalie", "Face-off specialist", "Not sure"] as const;

export const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;

export const DAILY_ANALYSIS_LIMIT = 30;

// Frames sampled from a clip and sent to the model.
export const MIN_FRAMES = 4;
export const MAX_FRAMES = 24;
export const FRAME_MAX_SIDE = 768;

export type CoachingContext = {
  skill: (typeof SKILLS)[number];
  position: (typeof POSITIONS)[number];
  level: (typeof LEVELS)[number];
};
