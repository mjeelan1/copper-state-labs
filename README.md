# Copper State Labs: CIS 591 course app

The starter app for CIS 591. Copper State Labs is a fictional Arizona company
(see the [Product Bible](docs/copper-state-labs/product-bible.md)); each module
adds a feature to this one app.

**Start here:** [Module 0 instructions](specs/module-0/instructions.md).
The [`docs/`](docs/README.md) folder explains the company and how the app fits
together; [`specs/`](specs/README.md) holds each module's work.

_Fictional — for educational use._

The app builds and runs with **no environment variables**. Pages that need
Supabase or the AI gateway show a "Set up …" card until you add them.

## Local setup

1. Install [Node 24](https://nodejs.org) (or run `nvm use`) and the [GitHub CLI](https://cli.github.com).
2. Clone your module branch, then run `npm run start-module` once to create your own public `copper-mN` repo.
3. Run `npm ci`.
4. Optional: copy the variables below into a new `.env.local` file.
5. Run `npm run dev` and open http://localhost:3000.

Or open the repo in **GitHub Codespaces**: it installs everything and starts the dev server for you.

## Environment variables

All are optional. Put them in `.env.local` (never commit it) and in your Vercel project settings.

| Variable                               | Used for                        | Where to find it                                                                   |
| -------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------- |
| `AI_GATEWAY_API_KEY`                   | All AI calls (`lib/ai/call.ts`) | Vercel dashboard > AI Gateway > API Keys                                           |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase database               | Supabase dashboard > Project Settings > API                                        |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase database               | Supabase dashboard > Project Settings > API Keys (publishable key)                 |
| `SUPABASE_DB_URL`                      | `npm run db:migrate` only       | Supabase dashboard > Connect > Direct connection (includes your database password) |

## Commands

| Command                              | What it does                                                           |
| ------------------------------------ | ---------------------------------------------------------------------- |
| `npm run dev`                        | Start the dev server                                                   |
| `npm test`                           | Run the app's tests                                                    |
| `npm run check`                      | Show which acceptance criteria for the current module pass             |
| `npm run lint` / `npm run typecheck` | Check code style and types                                             |
| `npm run format`                     | Format the code with Prettier                                          |
| `npm run db:migrate`                 | Apply `supabase/migrations` and the seed data to your Supabase project |
| `npm run start-module`               | One-time setup after cloning a module branch                           |

## AI coding agents

`CLAUDE.md` / `AGENTS.md` hold the rules for Claude Code and Codex. `.mcp.json`
gives Claude Code three MCP servers: shadcn, Next.js docs (`next-devtools`) and
Supabase (read-only).

**Codex** doesn't read `.mcp.json`. Add the same servers to `~/.codex/config.toml`:

```toml
[mcp_servers.shadcn]
command = "npx"
args = ["shadcn@4.21.4", "mcp"]

[mcp_servers.next-devtools]
command = "npx"
args = ["-y", "next-devtools-mcp@0.4.0"]

[mcp_servers.supabase]
url = "https://mcp.supabase.com/mcp?read_only=true"
```
