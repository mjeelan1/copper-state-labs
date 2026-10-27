# Module 2: Build Ask Copper, the shopping chatbot

_Fictional — for educational use._

Shoppers on the Copper State Labs site keep asking what things cost and what's in stock. This module, you add **Ask Copper**: a chat panel that answers by using **tools** (small pieces of code that look up prices, do the math and check stock in the database) instead of guessing.

The panel also shows its work. As the answer arrives, you watch Copper pick a tool, send it numbers, read the result and write the reply. By the end you'll be able to explain exactly what a tool is, and show someone what happens without one.

The full requirements are in **`specs/module-2/spec.md`**. Read it before you start. This page walks you through the steps.

| | |
|---|---|
| **You'll build** | Four tools, Copper's instructions, a streaming Server Action, and the chat panel |
| **Your repo** | `copper-m2` (public, on your GitHub account; a new repo, separate from `copper-m1`) |
| **Points** | 75 from tests, plus 10 for your report (a TA) and 15 for the live site |
| **Submit** | Your repo link, your Vercel link, and a screenshot of `npm run check` (see [What to submit](#what-to-submit)) |

---

## Before you start

- Module 1 is done: you have a `copper-m1` repo and a live Vercel site.
- Your tools still work: `node --version` starts with v24, and `gh auth status` says you're logged in.
- You have a **Google AI Studio API key** ([aistudio.google.com](https://aistudio.google.com) > Get API key). It's free and needs no credit card. You'll need it from Step 5 on; the tests don't need it.

## Step 1: Get the starter code and make it yours

```bash
cd ~/Developer        # or wherever you keep your projects
git clone --branch module-2-part-1 https://github.com/CIS-591/class-examples.git copper-m2
cd copper-m2
npm run start-module  # creates github.com/YOUR-USERNAME/copper-m2 (public)
npm ci
```

The starter is the finished Module 1 landing page, plus three starter files in `lib/copper/assistant/` and the stock list in `lib/copper/data/inventory.json`.

Check where you're starting from:

```bash
npm run check
```

Module 1's 12 criteria pass, and all 15 Module 2 criteria fail (**12 of 27**). The Module 2 ones are your to-do list. `REPORT` and `DEPLOY` show as "checked later".

## Step 2: Build the tools

Open your AI agent in the project folder. Start with the tools, because everything else depends on them:

```
Read specs/module-2/spec.md (section 1, "The four tools") and
lib/copper/assistant/tools.ts. Plan get_products, get_prices, calculate_cost
and check_availability, with their input rules. Show me how you'll work out
"Copper Home with Copper Plus, paid yearly, for 2 years", and what
get_products and check_availability each return for Copper Notes in Patina
Teal. Don't write code yet.
```

**Read the plan before you approve it.** Check:
- The math: $149 + 2 × $79 = **$307**. Copper Plus is counted **once**, even with two devices.
- Every price comes from the catalog, and stock comes from `readInventory()`, read fresh each time.
- Copper Notes in Patina Teal is "not a color", not "out of stock". Copper Notes only comes in Brushed Copper, Desert Sand and Night Sky.
- `get_products` says which colors exist; `check_availability` says which are on the shelf today. A shopper asking about one color needs both facts.

Then let it build, and run `npm run check`. **AC-M2.5 to AC-M2.10** should pass. Commit.

## Step 3: Write Copper's instructions

This step is yours, not the agent's. Open `lib/copper/assistant/instructions.ts` and replace the TODO with Copper's instructions, in your own words. Section 2 of the spec lists what they must cover:

- Copper's voice (warm, short, plain)
- Always use the tools for prices, totals and stock; never answer them from memory
- Only answer price and stock questions; for anything else, point to the Copper Crew
- Say so when it isn't sure, or when stock can't be checked

These instructions are the difference between a chatbot that checks and one that guesses. You'll see that in Step 6.

## Step 4: Stream the answer, then build the panel

```
Read specs/module-2/spec.md sections 3, 4 and 5, plus lib/ai/call.ts,
lib/ai/live.ts and lib/copper/assistant/progress.ts. Plan askCopper() in
lib/copper/assistant/ask.ts: stream with callStream, read result.fullStream,
and build up the Progress. Then plan the panel in
components/copper/ask-copper.tsx and the tool card. Don't write code yet.
```

**Things the checks look for**, so tell your agent about them:

- **Every model call goes through `callStream`** with `{ module: 2, feature: "ask-copper" }`, so it's logged with its cost and speed.
- **Pass `providerOptions: THOUGHT_SUMMARIES`**, so Gemini explains what it's doing.
- **The model gets the tools only when Use tools is on**, with at most 5 steps (`stopWhen: stepCountIs(5)`).
- **With tools off, send no instructions and no tools** — just the conversation. That's the point of the comparison: the same model, the same question, nothing telling it to check. Don't send Copper's instructions here; tell a model to "always use your tools" and then give it none, and it returns nothing at all.
- **Each update carries everything so far**, as a **fresh copy**. Hand out the object you keep changing and the panel's earlier updates change underneath it.
- **Return `{ progress }` immediately**, then read the stream in the background.
- **A tool step appears as soon as the model names the tool**, before its input is known. That's what lets the panel say "filling in the details…".
- **Tools on and tools off are separate chats.** Each sends only its own history.
- **The starter questions come back after every answer**, not just at the start. A shopper who typed their own question should still see all three waiting underneath the reply, so they can keep going with one click. Only hide them while a reply is streaming.
- **The tool card is open by default**, before the reply, with "What Copper sent" above "What came back".
- **No AI key? Show `<SetupRequired service="ai" />`** in the panel instead of the chat. `app/page.tsx` calls `isAiConfigured()` and passes the answer to the panel as a prop; a client component can't read the key.
- **One page only.** The panel calls a Server Action; don't add an API route or a new page.
- **Brand colors only**, as in Module 1.

Run `npm run check` after each part. Commit when **all 15 Module 2 criteria** pass.

## Step 5: Try it for real

Before you look at the chat, know what you're looking for. Section 5 of the
spec describes the panel exactly, so build what it describes; a TA compares
your panel with it. The four stations are there to make the agent loop
visible: the tools on offer, the model's thinking, the round trip to your
code, and the answer.



1. Add `GOOGLE_GENERATIVE_AI_API_KEY` to `.env.local` (see the README). It's the only key this module needs. Never commit this file.
2. Run `npm run dev`, open http://localhost:3000 and click **Ask Copper**.
3. Ask: "How much is Copper Home with Copper Plus, paid yearly, for 2 years?" Watch the stations appear: the tools Copper can use, what it was thinking, the tool it called with what it sent and what came back, then the answer.
4. Ask: "Is Copper Notes in Night Sky in stock?" This time it should call `check_availability`, which reads `lib/copper/data/inventory.json`.
5. Ask: "What colors does Copper Home come in?" That's `get_products`, straight from the catalog, without looking at stock at all.

Each question's cost and time are logged by `lib/ai/call.ts`. They appear in the terminal running `npm run dev`, as a line starting `[ai_calls]`.

## Step 6: Write your report

Open `specs/module-2/report.md` and fill it in:

1. Ask the five test questions with **Use tools on**, then ask the same five in the **tools-off** chat.
2. Mark each answer right or wrong, and copy its cost and time from `ai_calls`.
3. Read one tool card and one thought summary closely, and write down what they say.
4. Change a stock level in `lib/copper/data/inventory.json`, ask again, and see the answer change without touching any code.

The REPORT rubric in `spec.md` is what the TA uses. All of this costs well under a dollar, and Google's free tier may cover it entirely.

This is the one part of the module that needs real keys: the 75 test points never call a model, but the report is written from your own runs.

## Step 7: Check your work

```bash
npm run check       # aim for 27 of 27: all of Module 1 and Module 2
npm test            # the app's own tests
npm run lint        # code style
npm run typecheck   # type errors
npm run format      # tidies the spacing; the other four pass without it
```

`npm run lint` includes React's newer rules. If it complains that a variable
can't be reassigned after render, count with something the rule allows (an
index, or a running total you work out before the JSX) rather than changing a
variable inside a `.map()`.

## Step 8: Push and deploy

```bash
git push
```

1. Go to https://vercel.com/new and import your **`copper-m2`** repository.
2. Under **Environment Variables**, add `GOOGLE_GENERATIVE_AI_API_KEY`. Click **Deploy**.
3. Open your Vercel link and ask Copper a question.

The grader looks for "Ask Copper" on your live site. It shows even without the keys, but add them so your chatbot really works.

## What to submit

In Canvas:

1. Your GitHub repo link (`https://github.com/YOUR-USERNAME/copper-m2`)
2. Your Vercel link
3. A screenshot of `npm run check` showing **27 of 27** criteria passed

Your report is graded from `specs/module-2/report.md` in your repo, so make sure it's committed and pushed.

## How it's graded

| Part | Points | How |
|---|---|---|
| Part A: the chat widget (AC-M2.1 to AC-M2.4) | 20 | Tests |
| Part B: the tools (AC-M2.5 to AC-M2.10) | 30 | Tests |
| Part C: streaming (AC-M2.11 to AC-M2.15) | 25 | Tests (with a fake model and database, so they cost nothing) |
| REPORT: tools on vs. off | 10 | A TA, using the REPORT rubric in `spec.md` |
| DEPLOY: live on Vercel | 15 | The grader checks your live site |

Your last commit before the deadline is graded. Tests are run with your instructor's copy, so changing them in your repo doesn't change your grade.

## Rules

- **Don't edit** `specs/*/tests`, `specs/*/rubric.md`, `lib/copper/catalog.ts`, `lib/copper/inventory.ts` or `lib/copper/data/`.
- **Write Copper's instructions yourself.** You can ask your agent to critique them, but the words should be yours.
- **Never commit `.env.local` or paste keys into code.**
- **Everything about Copper State Labs is fictional.** Don't use real company names, logos or products.

## Troubleshooting

| Problem | Fix |
|---|---|
| The panel says "Set up Google AI" | Add `GOOGLE_GENERATIVE_AI_API_KEY` to `.env.local` and restart `npm run dev`. On Vercel, add it in Project Settings > Environment Variables and redeploy |
| Copper answers but no tool card appears | Use tools is off, or the model answered without a tool. Check your instructions say to **always** use the tools |
| Copper says nothing at all with tools off | You sent Copper's "always use your tools" instructions with no tools. With tools off, send no instructions at all |
| No thinking station appears | `providerOptions: THOUGHT_SUMMARIES` is missing from your `callStream` call |
| The answer appears all at once | You're waiting for the whole stream before sending an update. Send one on every change |
| Copper says stock can't be checked | `readInventory()` returned nothing. Check `lib/copper/data/inventory.json` is still valid JSON |
| AC-M2.5 fails with $386.88 or similar | Copper Plus is being counted once per device. It's once per household |
| AC-M2.6 fails | A price is typed into `tools.ts`. Read every price from `getProducts()` and `getPlans()` |
| AC-M2.7 or AC-M2.10 fails | An input schema is still `z.any()`, or lets in something the contract doesn't allow |
| AC-M2.9 fails after the stock changes | The tool saved the table once instead of reading it each time |
| AC-M2.10 fails on Patina Teal | It says "out of stock" instead of `"not_a_color"`. Check the color against the product's colors in the catalog first |
| AC-M2.11 fails | The model gets only one step, so it never sees the tool's result. Add `stopWhen: stepCountIs(5)` |
| AC-M2.12 fails | The tool step is added only when the input arrives. Add it at `tool-input-start`, when only the name is known |
| AC-1.4 (Module 1) fails | You added an API route or page. Use a Server Action (`"use server"`) in `lib/copper/assistant/ask.ts` instead |
| AC-4.1 (Module 1) fails | The new chat code uses a non-brand color. Swap it for a theme class |
| `npm run check` says "could not run" | A compile error. `npm run typecheck` shows it |
| `check_availability` finds no rows | A stock row's `product` holds "Copper Notes", not `copper-notes`. Look the name up with `getProducts()` first |
| Two tool cards appear for one tool call | `tool-input-start` gives `part.id`; the later parts give the same id as `part.toolCallId`. Match on it |
| `npm run build` stops with a Next.js security notice | Run it again; it continues. The course pins this version, so don't upgrade it |

Stuck for more than 20 minutes? Post in the course forum with the command you ran and the full error message, or come to office hours.
