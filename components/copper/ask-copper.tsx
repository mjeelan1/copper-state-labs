"use client";

// Module 2: Ask Copper, the floating shopping chatbot. The launcher, the header
// link or /#ask opens a side panel. Tools on and tools off are two separate
// chats, each sending only its own history. Each answer streams in from
// askCopper and is drawn by Answer (ask-copper-steps.tsx). The contract is in
// specs/module-2/spec.md, sections 4 and 5.
import { ArrowUpIcon, MessageCircleIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { Answer } from "@/components/copper/ask-copper-steps";
import { SetupRequired } from "@/components/setup-required";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { readLive } from "@/lib/ai/live";
import { askCopper, type ChatMessage } from "@/lib/copper/assistant/ask";
import type { Progress } from "@/lib/copper/assistant/progress";

/** Offered in an empty chat and again under every answer, word for word. */
export const STARTER_QUESTIONS = [
  "How much is Copper Home with Copper Plus, paid yearly, for 2 years?",
  "Is Copper Notes in Night Sky in stock?",
  "Is Copper Plus cheaper monthly or yearly?",
];

type Turn = { question: string; progress: Progress };
type ChatKey = "tools" | "noTools";

const COULD_NOT_ASK =
  "Sorry, I couldn’t reach Copper just now. Please try again in a moment.";

/** The conversation so far, as the model sees it: questions and finished replies. */
function historyOf(turns: Turn[]): ChatMessage[] {
  return turns.flatMap((turn): ChatMessage[] =>
    turn.progress.reply
      ? [
          { role: "user", content: turn.question },
          { role: "assistant", content: turn.progress.reply },
        ]
      : [{ role: "user", content: turn.question }],
  );
}

export function AskCopper({ aiConfigured }: { aiConfigured: boolean }) {
  const [open, setOpen] = useState(false);
  const [useTools, setUseTools] = useState(true);
  const [chats, setChats] = useState<Record<ChatKey, Turn[]>>({
    tools: [],
    noTools: [],
  });
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const key: ChatKey = useTools ? "tools" : "noTools";
  const turns = chats[key];
  const busy = turns.at(-1)?.progress.status === "working";

  // Open from /#ask, from a later #ask, and from any link to #ask. Once the
  // address already ends in #ask, clicking the link again fires no
  // hashchange, so the click itself opens the panel too.
  useEffect(() => {
    const openFromHash = () => {
      if (window.location.hash === "#ask") setOpen(true);
    };
    const openFromLink = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (target?.closest?.('a[href$="#ask"]')) setOpen(true);
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    document.addEventListener("click", openFromLink);
    return () => {
      window.removeEventListener("hashchange", openFromHash);
      document.removeEventListener("click", openFromLink);
    };
  }, []);

  // Keep the newest step in view as the answer streams in.
  useEffect(() => {
    const body = scrollRef.current;
    if (body) body.scrollTop = body.scrollHeight;
  }, [turns]);

  function changeOpen(next: boolean) {
    setOpen(next);
    if (!next && window.location.hash === "#ask") {
      const { pathname, search } = window.location;
      window.history.replaceState(null, "", pathname + search);
    }
  }

  async function ask(question: string) {
    const text = question.trim();
    if (!text || busy) return;
    const chat = key;
    const index = turns.length;
    const messages: ChatMessage[] = [
      ...historyOf(turns),
      { role: "user", content: text },
    ];
    const show = (progress: Progress) =>
      setChats((all) => {
        const next = all[chat].slice();
        next[index] = { question: text, progress };
        return { ...all, [chat]: next };
      });

    setDraft("");
    show({ steps: [], reply: "", status: "working" });
    try {
      const { progress } = await askCopper({
        messages,
        useTools: chat === "tools",
      });
      for await (const update of readLive(progress)) show(update);
    } catch {
      show({ steps: [], reply: COULD_NOT_ASK, status: "error" });
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void ask(draft);
  }

  return (
    <>
      <Button
        data-testid="ask-copper-launcher"
        onClick={() => changeOpen(true)}
        className="focus-visible:ring-ring fixed right-4 bottom-4 z-40 h-12 rounded-full px-5 text-xl font-bold shadow-lg"
      >
        <MessageCircleIcon aria-hidden className="size-5" />
        Ask Copper
      </Button>
      <Sheet open={open} onOpenChange={changeOpen}>
        <SheetContent
          data-testid="ask-copper"
          showCloseButton={false}
          className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md"
        >
          <div className="dark bg-background text-foreground">
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="bg-primary flex size-10 shrink-0 items-center justify-center rounded-full">
                <Image
                  src="/assets/brand/copper-mascot.png"
                  alt="Copper the robot mascot"
                  width={64}
                  height={64}
                  className="size-8"
                />
              </span>
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-lg font-bold">
                  Ask Copper
                </SheetTitle>
                <SheetDescription>
                  Prices, totals and stock, checked with tools.
                </SheetDescription>
              </div>
              <SheetClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close"
                  className="focus-visible:ring-ring size-11"
                >
                  <XIcon className="size-5" />
                </Button>
              </SheetClose>
            </div>
            {aiConfigured && (
              <div className="bg-secondary flex items-center gap-3 px-4 py-2">
                <div className="flex-1">
                  <p className="text-sm font-medium">Use tools</p>
                  <p className="text-muted-foreground text-sm">
                    {useTools ? "Checks every answer" : "Model guesses alone"}
                  </p>
                </div>
                <Switch
                  aria-label="Use tools"
                  checked={useTools}
                  onCheckedChange={setUseTools}
                />
              </div>
            )}
          </div>

          <div
            ref={scrollRef}
            className="bg-secondary text-foreground flex-1 overflow-y-auto px-4 py-4"
          >
            {!aiConfigured ? (
              <SetupRequired service="ai" />
            ) : (
              <>
                {turns.length === 0 && (
                  <p className="text-muted-foreground mb-4">
                    {useTools
                      ? "Hi, I’m Copper! Ask me what Copper products cost, what a plan adds up to, or what’s in stock today."
                      : "Tools are off, so I’ll answer from memory alone. Try the same questions and compare."}
                  </p>
                )}
                <ol className="flex flex-col gap-6">
                  {turns.map((turn, i) => (
                    <li key={i} className="flex flex-col gap-3">
                      <p className="bg-foreground text-background ml-auto max-w-[85%] rounded-2xl rounded-br-sm px-3 py-2">
                        {turn.question}
                      </p>
                      <Answer
                        progress={turn.progress}
                        useTools={key === "tools"}
                      />
                    </li>
                  ))}
                </ol>
                {!busy && (
                  <div className={turns.length > 0 ? "mt-6" : ""}>
                    <p className="text-muted-foreground mb-2 text-sm font-medium">
                      {turns.length > 0 ? "Ask another" : "Try asking"}
                    </p>
                    <ul className="flex flex-col gap-2">
                      {STARTER_QUESTIONS.map((starter) => (
                        <li key={starter}>
                          <Button
                            variant="outline"
                            onClick={() => void ask(starter)}
                            className="focus-visible:ring-ring h-auto min-h-11 w-full justify-start rounded-xl px-3 py-2 text-left whitespace-normal"
                          >
                            {starter}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>

          {aiConfigured && (
            <form
              onSubmit={submit}
              className="bg-background flex items-center gap-2 border-t p-3"
            >
              <Input
                aria-label="Your question"
                placeholder="Ask about prices, totals or stock"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                className="h-11 rounded-full px-4"
              />
              <Button
                type="submit"
                size="icon"
                aria-label="Send"
                disabled={busy || !draft.trim()}
                className="focus-visible:ring-ring size-11 shrink-0 rounded-full"
              >
                <ArrowUpIcon className="size-5" />
              </Button>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
