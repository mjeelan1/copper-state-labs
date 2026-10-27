// @vitest-environment node
import { spawnSync } from "node:child_process";
import { chmodSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { tempDir } from "./helpers/temp-dir";

const script = join(process.cwd(), "scripts/db-migrate.mjs");

function run(env: Record<string, string>) {
  // A fake `npx` on PATH records the command instead of touching a database.
  const bin = tempDir("fake-npx-");
  writeFileSync(join(bin, "npx"), '#!/bin/sh\necho "npx $*"\n');
  chmodSync(join(bin, "npx"), 0o755);
  return spawnSync(process.execPath, [script], {
    env: { NODE_ENV: "test", PATH: `${bin}:${process.env.PATH}`, ...env },
    encoding: "utf8",
  });
}

describe("npm run db:migrate", () => {
  it("explains how to set up Supabase when SUPABASE_DB_URL is missing", () => {
    const result = run({});
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Set up Supabase");
  });

  it("pushes migrations and the seed to SUPABASE_DB_URL", () => {
    const result = run({ SUPABASE_DB_URL: "postgresql://example" });
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(
      "npx supabase db push --db-url postgresql://example --include-seed --yes",
    );
  });
});
