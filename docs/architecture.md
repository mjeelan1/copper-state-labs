# Architecture

How the Copper State Labs app fits together. Each module adds a section at the
end (see [Adding a module](#adding-a-module)) when it changes how the app
works: new pages, tables or AI calls.

_Fictional — for educational use._

## The starter app (Module 0)

A Next.js app that builds, runs and deploys with **no environment variables**.
A Google AI Studio key is optional until a module needs one.

| Piece | Where | What it does |
|---|---|---|
| Pages | `app/` | `layout.tsx` sets the fonts and theme; `page.tsx` is the placeholder home page |
| Brand components | `components/copper/` | `Logo`, `SiteHeader`, `SiteFooter`, `ModeToggle` |
| UI kit | `components/ui/` (shadcn), `components/ai-elements/` (AI Elements) | The only UI libraries the app uses |
| Setup card | `components/setup-required.tsx` | `<SetupRequired service="ai" />`, shown instead of a page whose service isn't configured |
| Company catalog | `lib/copper/catalog.ts`, `lib/copper/data/catalog.json` | Product, plan and privacy facts from the Product Bible (Sections 3, 4, 8 and 10). Pages read prices and plan details from here instead of typing them (added in the Module 1 starter) |
| AI wrapper | `lib/ai/call.ts` | `callText` and `callObject`: every model call goes through these and is logged to the terminal |
| Models and prices | `lib/ai/models.ts`, `lib/ai/pricing.ts` | The approved Gemini models and their token prices |
| Module checks | `specs/module-N/`, `scripts/check.mjs` | Each module's spec, instructions, rubric and acceptance tests; `npm run check` runs them |

## Data flow

1. A user opens a page in `app/`.
2. Server code checks what's configured (`isAiConfigured()`). If the key is
   missing, the page renders `<SetupRequired />` instead of crashing.
3. Data comes from files under `lib/copper/data/`, except where a module has
   moved it to a database: Module 2 part 2 moves stock to a Supabase
   `inventory` table, read through `lib/copper/inventory.ts`. Facts that don't
   change daily (prices, colors) stay in the files.
4. AI requests go through `callText` / `callObject` in `lib/ai/call.ts`, which
   calls Google and then prints one `[ai_calls]` line: `module`, `feature`,
   `model`, tokens, `cost_usd`, `latency_ms`, `ok`.

```ts
const { text } = await callText(
  { module: 2, feature: "ask-copper" },
  { prompt },
);
```

## Two kinds of "AI tiers"

Don't mix these up:

- **Copper State Labs' product tiers** (On-device, Raw Ore, Refined, the
  Copper Cloud) are part of the fictional company. They are facts in the
  [Product Bible](copper-state-labs/product-bible.md) and rows in the `ai_tiers`
  table.
- **The models this app calls** are real Claude models listed in
  `lib/ai/models.ts`. Their cost is logged in `ai_calls`.

## Decisions

- **No environment variables required.** Every service is optional, so a fresh
  clone builds and deploys before any accounts are set up.
- **One AI wrapper.** Routing every call through `lib/ai/call.ts` gives one
  place to log cost and latency per module and feature.
- **No authentication or row-level security yet.** They arrive in a later
  module.

## Module 2: Ask Copper

**Summary:** a floating shopping chatbot that answers price, cost and stock
questions by calling tools instead of guessing, and shows each step (the tools
on offer, its thinking, each tool call, the reply) as the answer streams in.

| Piece | Where | What it does |
|---|---|---|
| Page / route | `app/page.tsx` | Still the one page. Renders `<AskCopper aiConfigured={isAiConfigured()} />`; no new routes |
| Components | `components/copper/ask-copper.tsx` | Launcher, side panel (`Sheet`), Use tools switch, the two chats, starter questions, composer |
| | `components/copper/ask-copper-steps.tsx` | One answer drawn as stations on a rail: tools on offer, thinking, tool cards, status line, reply |
| | `components/copper/site-header.tsx` | Adds the **Ask Copper** link to `#ask` |
| Server Action | `lib/copper/assistant/ask.ts` | `askCopper({ messages, useTools })` returns a live `Progress` straight away and fills it in from the stream |
| Tools | `lib/copper/assistant/tools.ts` | `get_products`, `get_prices`, `calculate_cost`, `check_availability`, each with a zod input contract. Read-only |
| Instructions | `lib/copper/assistant/instructions.ts` | `COPPER_INSTRUCTIONS`, the system prompt, sent only with tools on |
| Data | Supabase `inventory` table (`supabase/migrations/`, `supabase/seed.sql`) | Stock per product color, read fresh by `readInventory()` in `lib/copper/inventory.ts` on every check (part 2). Readable with the publishable key, writable by nobody through the app |
| Settings | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | In `.env.local` and in Vercel (Production and Preview). Without them, stock "can't be checked right now" instead of crashing |
| AI calls | `lib/ai/call.ts` (module 2, `ask-copper`) | `callStream` to Gemini 2.5 Flash with thought summaries, up to 5 steps. Roughly $0.002–$0.005 per question (an estimate; the real cost is in each `[ai_calls]` line) |

**Data flow:** shopper asks in the panel → `askCopper` Server Action →
`callStream` → Gemini picks a tool → the tool reads the catalog or the Supabase
stock table → the result goes back to Gemini → the reply. Each step is pushed to
the panel as a fresh `Progress` copy through `createLive()` / `readLive()`.

**Decisions and trade-offs:**
- Tools compute prices, totals and stock; the model only chooses tools and
  writes the reply, so it never does the arithmetic or remembers prices.
- A Server Action instead of an API route keeps the site a single page
  (Module 1's AC-1.4).
- Tools on and tools off are separate chats, so the tools-off model can't copy
  an answer the tools worked out.
- With tools off, no instructions are sent either: telling a model to "always
  use your tools" and giving it none makes it return nothing.

**Risks and open questions:**
- The model can still pick the wrong inputs (for example monthly instead of
  annual). The tool card shows exactly what it sent, so a shopper or the Copper
  Crew can spot it.
- Stock is as current as the Supabase table: a change in the Table Editor shows
  up on the next question, with no commit or deploy. When it can't be read
  (keys missing, or the free project paused after a week without use), the tool
  says so instead of guessing.
- Anyone with the Supabase login can change stock, so that login is now as
  sensitive as the code.
- Thought summaries are shown to shoppers as-is; they can be wrong even when the
  final answer is right.

## Adding a module

When a module changes how the app fits together, add a section here:

```md
## Module N: <feature name>

**Summary:** one or two sentences: what this adds and why.

| Piece | Where | What it does |
|---|---|---|
| Page / route | `app/...` | |
| Components | `components/...` | |
| Data | `lib/copper/data/...` | Data files added |
| AI calls | `lib/ai/call.ts` (module, feature) | Model, prompt purpose, expected cost per call |

**Data flow:** user action → page → server code → database / model → response.

**Decisions and trade-offs:** what you chose, the alternatives, and why.

**Risks and open questions:** cost, privacy, accuracy or safety risks, and how
you handle them.
```
