// Applies every migration in supabase/migrations, plus the seed, to the
// Supabase project in SUPABASE_DB_URL. Run with: npm run db:migrate
import { spawnSync } from "node:child_process";

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error(
    [
      "Set up Supabase to run migrations.",
      "Add SUPABASE_DB_URL to .env.local. In the Supabase dashboard, open",
      "Connect > Direct connection and copy the connection string (with your database password).",
    ].join("\n"),
  );
  process.exit(1);
}

const result = spawnSync(
  "npx",
  ["supabase", "db", "push", "--db-url", dbUrl, "--include-seed", "--yes"],
  { stdio: "inherit" },
);
process.exit(result.status ?? 1);
