// @vitest-environment node
import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Criterion 5: a real call through the gateway writes one row to ai_calls.
// Runs only when .env.local (or the environment) has the gateway key and
// Supabase settings; otherwise it's skipped.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const ready = Boolean(
  process.env.AI_GATEWAY_API_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

describe.skipIf(!ready)("AI call logging (live gateway + Supabase)", () => {
  it("writes one ai_calls row with tokens, cost and latency", async () => {
    const { callText } = await import("@/lib/ai/call");
    const { createStatelessClient } = await import("@/lib/supabase/server");
    const feature = `integration-test-${Date.now()}`;

    await callText(
      { module: 0, feature },
      { prompt: "Reply with the word copper." },
    );

    const { data, error } = await createStatelessClient()!
      .from("ai_calls")
      .select("*")
      .eq("feature", feature);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].input_tokens).toBeGreaterThan(0);
    expect(data![0].output_tokens).toBeGreaterThan(0);
    expect(Number(data![0].cost_usd)).toBeGreaterThan(0);
    expect(data![0].latency_ms).toBeGreaterThan(0);
  }, 60_000);
});
