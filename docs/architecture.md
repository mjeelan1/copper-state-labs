# Architecture

How the Copper State Labs app fits together. Each module adds a section at the
end (see [Adding a module](#adding-a-module)) when it changes how the app
works: new pages, tables or AI calls.

_Fictional — for educational use._

## The starter app (Module 0)

A Next.js app that builds, runs and deploys with **no environment variables**.
Supabase and the AI gateway are optional until a module needs them.

| Piece | Where | What it does |
|---|---|---|
| Pages | `app/` | `layout.tsx` sets the fonts and theme; `page.tsx` is the placeholder home page |
| Brand components | `components/copper/` | `Logo`, `SiteHeader`, `SiteFooter`, `ModeToggle` |
| UI kit | `components/ui/` (shadcn), `components/ai-elements/` (AI Elements) | The only UI libraries the app uses |
| Setup card | `components/setup-required.tsx` | `<SetupRequired service="supabase" \| "ai" />`, shown instead of a page whose service isn't configured |
| Database helpers | `lib/supabase/` | `createClient()` for the server and the browser; returns `null` when Supabase isn't set up |
| AI wrapper | `lib/ai/call.ts` | `callText` and `callObject`: every model call goes through these and is logged to `ai_calls` |
| Models and prices | `lib/ai/models.ts`, `lib/ai/pricing.ts` | The approved models (Claude Haiku, Sonnet, Opus through the Vercel AI Gateway) and their token prices |
| Database | `supabase/migrations/`, `supabase/seed.sql` | Company tables from the Product Bible (Section 10) plus `ai_calls` |
| Module checks | `specs/module-N/`, `scripts/check.mjs` | Each module's spec, instructions, rubric and acceptance tests; `npm run check` runs them |

## Data flow

1. A user opens a page in `app/`.
2. Server code checks what's configured (`isSupabaseConfigured()`,
   `isAiConfigured()`). If something is missing, the page renders
   `<SetupRequired />` instead of crashing.
3. Data comes from Supabase through `lib/supabase/server.ts`.
4. AI requests go through `callText` / `callObject` in `lib/ai/call.ts`, which
   calls the model through the AI Gateway and then writes one row to `ai_calls`:
   `module`, `feature`, `model`, tokens, `cost_usd`, `latency_ms`, `ok`. Without
   Supabase, the row is logged to the console instead.

```ts
const { text } = await callText(
  { module: 2, feature: "review-radar" },
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

## Adding a module

When a module changes how the app fits together, add a section here:

```md
## Module N: <feature name>

**Summary:** one or two sentences: what this adds and why.

| Piece | Where | What it does |
|---|---|---|
| Page / route | `app/...` | |
| Components | `components/...` | |
| Data | `supabase/migrations/...` | Tables and columns added |
| AI calls | `lib/ai/call.ts` (module, feature) | Model, prompt purpose, expected cost per call |

**Data flow:** user action → page → server code → database / model → response.

**Decisions and trade-offs:** what you chose, the alternatives, and why.

**Risks and open questions:** cost, privacy, accuracy or safety risks, and how
you handle them.
```
