// @vitest-environment node
import { MockLanguageModelV4 } from "ai/test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  AiNotConfiguredError,
  callObject,
  callText,
  isAiConfigured,
} from "@/lib/ai/call";
import { MODELS } from "@/lib/ai/models";
import { costUsd, PRICING } from "@/lib/ai/pricing";

const insert = vi.fn();
let supabaseConfigured = false;

vi.mock("@/lib/supabase/server", () => ({
  createStatelessClient: () =>
    supabaseConfigured ? { from: () => ({ insert }) } : null,
}));

// The gateway hands back whatever mock model the test sets.
let model: MockLanguageModelV4;
vi.mock("ai", async (importOriginal) => ({
  ...(await importOriginal<typeof import("ai")>()),
  createGateway: () => () => model,
}));

function replyWith(text: string, input = 1000, output = 200) {
  return new MockLanguageModelV4({
    doGenerate: async () => ({
      content: [{ type: "text", text }],
      finishReason: { unified: "stop", raw: undefined },
      usage: {
        inputTokens: {
          total: input,
          noCache: input,
          cacheRead: undefined,
          cacheWrite: undefined,
        },
        outputTokens: { total: output, text: output, reasoning: undefined },
      },
      warnings: [],
    }),
  });
}

beforeEach(() => {
  vi.stubEnv("AI_GATEWAY_API_KEY", "test-key");
  supabaseConfigured = false;
  insert.mockReset().mockResolvedValue({ error: null });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("pricing", () => {
  it("has a price for every approved model", () => {
    for (const { id } of MODELS) expect(PRICING[id]).toBeDefined();
  });

  it("computes cost from tokens and price per million", () => {
    // Sonnet 5.5: 1,000 x $2/M + 200 x $10/M = $0.004
    expect(costUsd("anthropic/claude-sonnet-5.5", 1000, 200)).toBeCloseTo(
      0.004,
      9,
    );
  });
});

describe("lib/ai/call.ts", () => {
  it("returns text and writes one ai_calls row with tokens, cost and latency", async () => {
    supabaseConfigured = true;
    model = replyWith("Hello from Copper");
    const result = await callText(
      {
        module: 2,
        feature: "review-radar",
        model: "anthropic/claude-sonnet-5.5",
      },
      { prompt: "Say hello" },
    );
    expect(result.text).toBe("Hello from Copper");
    expect(insert).toHaveBeenCalledTimes(1);
    const row = insert.mock.calls[0][0];
    expect(row).toMatchObject({
      module: 2,
      feature: "review-radar",
      model: "anthropic/claude-sonnet-5.5",
      input_tokens: 1000,
      output_tokens: 200,
      ok: true,
    });
    expect(row.cost_usd).toBeCloseTo(0.004, 9);
    expect(row.latency_ms).toBeGreaterThanOrEqual(0);
    expect(new Date(row.created_at).toString()).not.toBe("Invalid Date");
  });

  it("returns a typed object for structured calls", async () => {
    model = replyWith('{"category":"wake word","flag":false}');
    vi.spyOn(console, "info").mockImplementation(() => {});
    const result = await callObject(
      { module: 2, feature: "classify-review" },
      {
        prompt: "Classify this review",
        schema: z.object({ category: z.string(), flag: z.boolean() }),
      },
    );
    expect(result.output).toEqual({ category: "wake word", flag: false });
  });

  it("logs to the console and doesn't throw when Supabase isn't set up", async () => {
    model = replyWith("ok");
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    await expect(
      callText({ module: 1, feature: "test" }, { prompt: "hi" }),
    ).resolves.toBeDefined();
    expect(insert).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith(
      "[ai_calls]",
      expect.stringContaining('"feature":"test"'),
    );
  });

  it("uses Claude Haiku 5.5 when no model is given", async () => {
    supabaseConfigured = true;
    model = replyWith("ok");
    await callText({ module: 1, feature: "test" }, { prompt: "hi" });
    expect(insert.mock.calls[0][0].model).toBe("anthropic/claude-haiku-5.5");
  });

  it("logs failed calls with ok: false and re-throws the error", async () => {
    supabaseConfigured = true;
    model = new MockLanguageModelV4({
      doGenerate: async () => {
        throw new Error("gateway down");
      },
    });
    await expect(
      callText({ module: 1, feature: "test" }, { prompt: "hi", maxRetries: 0 }),
    ).rejects.toThrow("gateway down");
    expect(insert.mock.calls[0][0]).toMatchObject({
      ok: false,
      input_tokens: null,
      cost_usd: null,
    });
  });

  it("keeps working when saving the log row fails", async () => {
    supabaseConfigured = true;
    insert.mockResolvedValue({ error: { message: "table missing" } });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    model = replyWith("still ok");
    const result = await callText(
      { module: 1, feature: "test" },
      { prompt: "hi" },
    );
    expect(result.text).toBe("still ok");
    expect(warn).toHaveBeenCalled();
  });

  it("asks for the gateway key when it isn't set", async () => {
    vi.stubEnv("AI_GATEWAY_API_KEY", "");
    expect(isAiConfigured()).toBe(false);
    await expect(
      callText({ module: 1, feature: "test" }, { prompt: "hi" }),
    ).rejects.toBeInstanceOf(AiNotConfiguredError);
  });
});
