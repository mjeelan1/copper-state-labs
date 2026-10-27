"use server";

// Module 2: the server action the Ask Copper chat calls. It streams the
// conversation to the model through callStream (lib/ai/call.ts), with or
// without the tools, and sends back each step as it happens, so the panel can
// show Copper thinking and using its tools. The contract is in
// specs/module-2/spec.md.
import type { Live } from "@/lib/ai/live";
import type { Progress } from "@/lib/copper/assistant/progress";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type AskCopperRequest = {
  messages: ChatMessage[];
  useTools: boolean;
};

export type AskCopperResult = { progress: Live<Progress> };

/** At most this many model steps (tool calls plus the reply) per question. */
const MAX_STEPS = 5;

export async function askCopper(
  request: AskCopperRequest,
): Promise<AskCopperResult> {
  // TODO (AC-M2.11 to AC-M2.15): stream the question to the model and send
  // back each step. MAX_STEPS is the step limit to pass to stopWhen.
  void request;
  void MAX_STEPS;
  throw new Error("askCopper isn't built yet");
}
