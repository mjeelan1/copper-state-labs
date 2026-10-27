// The course's approved models, called through the Vercel AI Gateway.
// Ids use the gateway's format ("provider/model").
export const MODELS = [
  {
    id: "anthropic/claude-haiku-5.5",
    label: "Claude Haiku 5.5 (fast, low cost)",
  },
  { id: "anthropic/claude-sonnet-5.5", label: "Claude Sonnet 5.5 (balanced)" },
  { id: "anthropic/claude-opus-5.5", label: "Claude Opus 5.5 (most capable)" },
] as const;

export type ModelId = (typeof MODELS)[number]["id"];

export const DEFAULT_MODEL: ModelId = "anthropic/claude-haiku-5.5";
