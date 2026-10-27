import { createGateway, generateText, Output } from "ai";
import type { z } from "zod";
import { DEFAULT_MODEL, type ModelId } from "@/lib/ai/models";
import { costUsd } from "@/lib/ai/pricing";
import { createStatelessClient } from "@/lib/supabase/server";

// Every model call in the app goes through this file, so each one is logged
// to the ai_calls table (or the console when Supabase isn't set up).

export class AiNotConfiguredError extends Error {
  constructor() {
    super(
      "Set up the AI gateway to use this feature: add AI_GATEWAY_API_KEY to .env.local.",
    );
    this.name = "AiNotConfiguredError";
  }
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.AI_GATEWAY_API_KEY);
}

/** Which module and feature made the call, for the ai_calls log. */
export type CallInfo = { module: number; feature: string; model?: ModelId };

// Omit that keeps generateText's "prompt or messages" union intact.
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;
type TextOptions = DistributiveOmit<
  Parameters<typeof generateText>[0],
  "model" | "output"
>;

export type AiCallRow = {
  module: number;
  feature: string;
  model: ModelId;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_usd: number | null;
  latency_ms: number;
  ok: boolean;
  created_at: string;
};

function languageModel(model: ModelId) {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) throw new AiNotConfiguredError();
  return createGateway({ apiKey })(model);
}

async function logCall(row: AiCallRow): Promise<void> {
  const supabase = createStatelessClient();
  if (!supabase) {
    console.info("[ai_calls]", JSON.stringify(row));
    return;
  }
  const { error } = await supabase.from("ai_calls").insert(row);
  // Logging must never break the feature that made the call.
  if (error) console.warn("[ai_calls] could not save row:", error.message);
}

async function tracked<
  T extends { usage: { inputTokens?: number; outputTokens?: number } },
>(info: CallInfo, run: (model: ModelId) => Promise<T>): Promise<T> {
  const model = info.model ?? DEFAULT_MODEL;
  const started = performance.now();
  const row = (ok: boolean, usage?: T["usage"]): AiCallRow => {
    const input = usage?.inputTokens ?? null;
    const output = usage?.outputTokens ?? null;
    return {
      module: info.module,
      feature: info.feature,
      model,
      input_tokens: input,
      output_tokens: output,
      cost_usd:
        input !== null && output !== null
          ? costUsd(model, input, output)
          : null,
      latency_ms: Math.round(performance.now() - started),
      ok,
      created_at: new Date().toISOString(),
    };
  };
  try {
    const result = await run(model);
    await logCall(row(true, result.usage));
    return result;
  } catch (error) {
    if (!(error instanceof AiNotConfiguredError)) await logCall(row(false));
    throw error;
  }
}

/** Generates text. Example: callText({ module: 2, feature: "review-radar" }, { prompt }) */
export async function callText(info: CallInfo, options: TextOptions) {
  return tracked(info, (model) =>
    generateText({ ...options, model: languageModel(model) }),
  );
}

/** Generates an object that matches a zod schema; read it from `result.output`. */
export async function callObject<Schema extends z.ZodType>(
  info: CallInfo,
  options: TextOptions & { schema: Schema },
) {
  const { schema, ...rest } = options;
  return tracked(info, (model) =>
    generateText({
      ...rest,
      model: languageModel(model),
      output: Output.object({ schema }),
    }),
  );
}
