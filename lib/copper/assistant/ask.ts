"use server";

// Module 2: the server action the Ask Copper chat calls. It streams the
// conversation to the model through callStream (lib/ai/call.ts), with or
// without the tools, and sends back each step as it happens, so the panel can
// show Copper thinking and using its tools. The contract is in
// specs/module-2/spec.md.
import { stepCountIs } from "ai";
import { callStream, THOUGHT_SUMMARIES } from "@/lib/ai/call";
import { createLive, type Live } from "@/lib/ai/live";
import { COPPER_INSTRUCTIONS } from "@/lib/copper/assistant/instructions";
import type { Progress, ToolStep } from "@/lib/copper/assistant/progress";
import { copperTools } from "@/lib/copper/assistant/tools";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type AskCopperRequest = {
  messages: ChatMessage[];
  useTools: boolean;
};

export type AskCopperResult = { progress: Live<Progress> };

/** At most this many model steps (tool calls plus the reply) per question. */
const MAX_STEPS = 5;

const NO_REPLY =
  "Sorry, I don't have an answer for that. Could you ask it another way?";
const FAILED =
  "Sorry, something went wrong on my end. Please try again in a moment.";

export async function askCopper(
  request: AskCopperRequest,
): Promise<AskCopperResult> {
  const live = createLive<Progress>();
  // Returned straight away; the answer streams into it in the background.
  void streamAnswer(request, live);
  return { progress: live.live };
}

/** A copy of the progress, so updates already sent never change. */
function snapshot(progress: Progress): Progress {
  return { ...progress, steps: progress.steps.map((step) => ({ ...step })) };
}

/**
 * Why a model call failed, for the terminal: the HTTP status and the
 * provider's message (for example a retired model's 404), with any API key
 * hidden. The shopper only ever sees the short apology.
 */
function failureReason(error: unknown): string {
  const status = (error as { statusCode?: unknown } | null)?.statusCode;
  const message = error instanceof Error ? error.message : String(error);
  const reason = typeof status === "number" ? `${status} ${message}` : message;
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  return (key ? reason.split(key).join("[key hidden]") : reason).replace(
    /AIza[0-9A-Za-z_-]{20,}/g,
    "[key hidden]",
  );
}

async function streamAnswer(
  { messages, useTools }: AskCopperRequest,
  live: ReturnType<typeof createLive<Progress>>,
) {
  const progress: Progress = { steps: [], reply: "", status: "working" };
  // tool-input-start names a step by `id`; the later parts use the same value
  // as `toolCallId`.
  const toolStep = (id: string) =>
    progress.steps.find(
      (step): step is ToolStep => step.type === "tool" && step.id === id,
    );

  try {
    // With tools off, the model gets only the conversation: no instructions
    // and no tools, so nothing tells it to check. Thought summaries go both
    // ways, so the panel can show it thinking in either chat.
    const result = callStream(
      { module: 2, feature: "ask-copper" },
      useTools
        ? {
            instructions: COPPER_INSTRUCTIONS,
            messages,
            tools: copperTools,
            stopWhen: stepCountIs(MAX_STEPS),
            providerOptions: THOUGHT_SUMMARIES,
          }
        : { messages, providerOptions: THOUGHT_SUMMARIES },
    );

    for await (const part of result.fullStream) {
      switch (part.type) {
        case "reasoning-delta": {
          const last = progress.steps.at(-1);
          if (last?.type === "thinking") last.text += part.text;
          else progress.steps.push({ type: "thinking", text: part.text });
          break;
        }
        case "tool-input-start":
          progress.steps.push({
            type: "tool",
            id: part.id,
            name: part.toolName,
            state: "calling",
          });
          break;
        case "tool-call": {
          const step = toolStep(part.toolCallId);
          if (step) step.input = part.input;
          else
            progress.steps.push({
              type: "tool",
              id: part.toolCallId,
              name: part.toolName,
              state: "calling",
              input: part.input,
            });
          break;
        }
        case "tool-result": {
          const step = toolStep(part.toolCallId);
          if (!step) continue;
          step.output = part.output;
          step.state = "done";
          break;
        }
        case "tool-error": {
          const step = toolStep(part.toolCallId);
          if (!step) continue;
          step.output =
            part.error instanceof Error
              ? part.error.message
              : String(part.error);
          step.state = "error";
          break;
        }
        case "text-delta":
          progress.reply += part.text;
          break;
        case "error":
          throw part.error;
        default:
          continue;
      }
      live.update(snapshot(progress));
    }

    if (!progress.reply.trim()) progress.reply = NO_REPLY;
    progress.status = "done";
  } catch (error) {
    console.error("[ask-copper] the answer failed:", failureReason(error));
    if (!progress.reply.trim()) progress.reply = FAILED;
    progress.status = "error";
  }
  live.done(snapshot(progress));
}
