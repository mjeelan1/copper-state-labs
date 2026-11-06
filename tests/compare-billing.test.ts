// Module 2 extension: compare_billing, the fifth tool. It compares paying for
// a plan monthly vs. yearly, so Copper never does that math itself. Fast
// checks with a mock model, so they need no AI key and cost nothing.
import type { LanguageModelV4StreamPart as ModelStreamPart } from "@ai-sdk/provider";
import { convertArrayToReadableStream, MockLanguageModelV4 } from "ai/test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { finalValue } from "@/lib/ai/live";
import type { ToolStep } from "@/lib/copper/assistant/progress";

let model: MockLanguageModelV4;
vi.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: () => () => model,
}));

type StreamPart = Parameters<
  typeof convertArrayToReadableStream<ModelStreamPart>
>[0][number];

const usage = {
  inputTokens: { total: 500, noCache: 500, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 50, text: 50, reasoning: undefined },
};
const finish = (reason: "stop" | "tool-calls"): StreamPart => ({
  type: "finish",
  finishReason: { unified: reason, raw: undefined },
  usage,
});
const says = (text: string): StreamPart[] => [
  { type: "text-start", id: "t1" },
  { type: "text-delta", id: "t1", delta: text },
  { type: "text-end", id: "t1" },
  finish("stop"),
];
const calls = (toolName: string, input: unknown): StreamPart[] => [
  { type: "tool-input-start", id: "call-1", toolName },
  { type: "tool-input-delta", id: "call-1", delta: JSON.stringify(input) },
  { type: "tool-input-end", id: "call-1" },
  { type: "tool-call", toolCallId: "call-1", toolName, input: JSON.stringify(input) },
  finish("tool-calls"),
];
/** A mock model that streams each of `steps` in turn, one per model step. */
function modelStreaming(...steps: StreamPart[][]) {
  let step = 0;
  return new MockLanguageModelV4({
    doStream: async () => ({
      stream: convertArrayToReadableStream(steps[step++] ?? says("")),
    }),
  });
}

async function loadTools() {
  vi.resetModules();
  return import("@/lib/copper/assistant/tools");
}

async function loadAsk() {
  vi.resetModules();
  vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "AIza-test-key");
  return import("@/lib/copper/assistant/ask");
}

const compare = async (input: unknown) => {
  const { compareBilling, compareBillingInput } = await loadTools();
  return compareBilling(compareBillingInput.parse(input));
};

beforeEach(() => {
  // askCopper logs one [ai_calls] line per question; keep the output quiet.
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  vi.doUnmock("@/lib/copper/catalog");
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("compare_billing", () => {
  it("compares Copper Plus monthly vs. yearly and says what yearly saves", async () => {
    // 1 year: $7.99 x 12 = $95.88 monthly vs. $79 yearly.
    expect(await compare({ plan: "copper-plus", years: 1 })).toEqual({
      plan: "Copper Plus",
      years: 1,
      monthlyTotalUsd: 95.88,
      annualTotalUsd: 79,
      cheaper: "annual",
      savingsUsd: 16.88,
    });
    // 2 years: $191.76 vs. $158.
    expect(await compare({ plan: "copper-plus", years: 2 })).toMatchObject({
      monthlyTotalUsd: 191.76,
      annualTotalUsd: 158,
      cheaper: "annual",
      savingsUsd: 33.76,
    });
  });

  it("says the Free plan costs the same either way", async () => {
    expect(await compare({ plan: "free", years: 3 })).toMatchObject({
      plan: "Free",
      monthlyTotalUsd: 0,
      annualTotalUsd: 0,
      cheaper: "same",
      savingsUsd: 0,
    });
  });

  it("follows the catalog when prices change", async () => {
    vi.doMock("@/lib/copper/catalog", async (importOriginal) => {
      const real = await importOriginal<typeof import("@/lib/copper/catalog")>();
      return {
        ...real,
        getPlans: () =>
          real
            .getPlans()
            .map((p) =>
              p.id === "copper-plus" ? { ...p, monthlyUsd: 9.49, annualUsd: 95 } : p,
            ),
      };
    });
    // $9.49 x 12 = $113.88 monthly vs. $95 yearly.
    expect(await compare({ plan: "copper-plus", years: 1 })).toMatchObject({
      monthlyTotalUsd: 113.88,
      annualTotalUsd: 95,
      savingsUsd: 18.88,
    });
  });

  it("rejects input outside its contract", async () => {
    const { compareBillingInput } = await loadTools();
    const bad = [
      { plan: "copper-plus", years: 0 },
      { plan: "copper-plus", years: 6 },
      { plan: "copper-plus", years: 1.5 },
      { plan: "copper-plus" },
      { plan: "copper-gold", years: 1 },
      { years: 1 },
    ];
    for (const input of bad) {
      expect(compareBillingInput.safeParse(input).success, JSON.stringify(input)).toBe(false);
    }
  });

  it("is described for the model, and the course's four tools stay as they were", async () => {
    const { copperTools, extensionTools } = await loadTools();
    expect(Object.keys(extensionTools)).toEqual(["compare_billing"]);
    expect(extensionTools.compare_billing.description).toMatch(/monthly/);
    expect(typeof extensionTools.compare_billing.execute).toBe("function");
    expect(Object.keys(copperTools)).not.toContain("compare_billing");
  });
});

describe("askCopper with compare_billing", () => {
  const question = [{ role: "user" as const, content: "Is Copper Plus cheaper monthly or yearly?" }];

  it("hands Copper the tool with tools on, and no tools at all with tools off", async () => {
    model = modelStreaming(says("ok"));
    let { askCopper } = await loadAsk();
    await finalValue((await askCopper({ messages: question, useTools: true })).progress);
    const names = (model.doStreamCalls[0].tools ?? []).map((t) => t.name);
    expect(names).toContain("compare_billing");
    expect(names).toHaveLength(5);

    model = modelStreaming(says("About the same?"));
    ({ askCopper } = await loadAsk());
    await finalValue((await askCopper({ messages: question, useTools: false })).progress);
    expect(model.doStreamCalls[0].tools ?? []).toHaveLength(0);
  });

  it("runs the tool when Copper calls it and shows what came back", async () => {
    model = modelStreaming(
      calls("compare_billing", { plan: "copper-plus", years: 1 }),
      says("Yearly is cheaper: you save $16.88."),
    );
    const { askCopper } = await loadAsk();
    const result = await finalValue(
      (await askCopper({ messages: question, useTools: true })).progress,
    );
    expect(result.status).toBe("done");
    expect(result.reply).toBe("Yearly is cheaper: you save $16.88.");
    const step = result.steps.find(
      (s): s is ToolStep => s.type === "tool" && s.name === "compare_billing",
    );
    expect(step?.state).toBe("done");
    expect(step?.input).toEqual({ plan: "copper-plus", years: 1 });
    expect(step?.output).toMatchObject({ cheaper: "annual", savingsUsd: 16.88 });
  });
});
