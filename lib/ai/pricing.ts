import type { ModelId } from "@/lib/ai/models";

// US dollars per million tokens: Anthropic list prices as of 2026-10.
// The gateway may bill slightly differently; these are for cost estimates.
// Claude Haiku 5.5's price is for prompts up to 100K tokens.
export const PRICING: Record<ModelId, { input: number; output: number }> = {
  "anthropic/claude-haiku-5.5": { input: 0.1, output: 0.5 },
  "anthropic/claude-sonnet-5.5": { input: 2, output: 10 },
  "anthropic/claude-opus-5.5": { input: 4, output: 20 },
};

export function costUsd(
  model: ModelId,
  inputTokens: number,
  outputTokens: number,
): number {
  const price = PRICING[model];
  return (inputTokens * price.input + outputTokens * price.output) / 1_000_000;
}
