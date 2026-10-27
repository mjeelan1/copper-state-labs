import { APICallError } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { afterEach, describe, expect, it, vi } from "vitest";
import { finalValue } from "@/lib/ai/live";

const KEY = "AIzaSyTestKeyThatMustNeverBePrinted123456";

// Google hands back a model that refuses every call, the way a retired model
// does: a 404 whose message (and, here, URL) mentions the key.
const retired = new MockLanguageModelV4({
  doStream: async () => {
    throw new APICallError({
      message: `This model models/gemini-2.5-flash is no longer available to new users. (key ${KEY})`,
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash?key=${KEY}`,
      requestBodyValues: {},
      statusCode: 404,
    });
  },
});
vi.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: () => () => retired,
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("askCopper when the model call fails", () => {
  it("prints the real reason to the terminal, never the key, and apologizes to the shopper", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", KEY);
    vi.spyOn(console, "info").mockImplementation(() => {});
    const printed = vi.spyOn(console, "error").mockImplementation(() => {});
    const { askCopper } = await import("@/lib/copper/assistant/ask");

    const result = await finalValue(
      (
        await askCopper({
          messages: [{ role: "user", content: "Is Copper Notes in stock?" }],
          useTools: true,
        })
      ).progress,
    );

    expect(result.status).toBe("error");
    expect(result.reply).toBe(
      "Sorry, something went wrong on my end. Please try again in a moment.",
    );
    const terminal = printed.mock.calls.flat().join(" ");
    expect(terminal).toContain("[ask-copper]");
    expect(terminal).toContain("404");
    expect(terminal).toContain("no longer available to new users");
    expect(terminal).not.toContain(KEY);
    expect(JSON.stringify(result)).not.toContain(KEY);
  });
});
