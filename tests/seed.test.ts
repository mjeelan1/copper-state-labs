// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite-pgvector";
import { beforeAll, describe, expect, it } from "vitest";

const BIBLE_TABLES = ["products", "plans", "assistant_versions", "ai_tiers"];

// Reads a markdown table that follows a "### `name`" heading in the Bible.
function bibleTable(name: string): Record<string, string>[] {
  const bible = readFileSync("docs/copper-state-labs/product-bible.md", "utf8");
  const section = bible.split(`### \`${name}\``)[1];
  if (!section) throw new Error(`Table ${name} not found in the Bible`);
  const lines = section.split("\n").map((line) => line.trim());
  const start = lines.findIndex((line) => line.startsWith("|"));
  const end = lines.findIndex((line, i) => i > start && !line.startsWith("|"));
  const [header, , ...rows] = lines.slice(start, end === -1 ? undefined : end);
  const cells = (line: string) =>
    line
      .slice(1, -1)
      .split("|")
      .map((cell) => cell.trim());
  const columns = cells(header);
  return rows.map((row) =>
    Object.fromEntries(cells(row).map((value, i) => [columns[i], value])),
  );
}

// Brings a database value and a Bible value to the same form.
function same(dbValue: string, bibleValue: string): boolean {
  if (bibleValue === "Yes" || bibleValue === "No") {
    return dbValue === (bibleValue === "Yes" ? "true" : "false");
  }
  if (/^\d+(\.\d+)?$/.test(bibleValue) && /^\d+(\.\d+)?$/.test(dbValue)) {
    return Number(dbValue) === Number(bibleValue);
  }
  return dbValue === bibleValue;
}

let db: PGlite;

beforeAll(async () => {
  db = new PGlite({ extensions: { vector } });
  for (const file of readdirSync("supabase/migrations").sort()) {
    await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
  }
  const seed = readFileSync("supabase/seed.sql", "utf8");
  await db.exec(seed);
  await db.exec(seed); // The seed must be safe to run twice.
});

describe("Supabase migrations and seed", () => {
  it("enables pgvector", async () => {
    const { rows } = await db.query(
      "select extname from pg_extension where extname = 'vector'",
    );
    expect(rows).toHaveLength(1);
  });

  it.each(BIBLE_TABLES)(
    "%s matches Bible Section 10 row for row",
    async (name) => {
      const expected = bibleTable(name);
      const columns = Object.keys(expected[0]);
      const { rows } = await db.query<Record<string, string>>(
        `select ${columns.map((c) => `${c}::text as ${c}`).join(", ")} from ${name}`,
      );
      expect(rows).toHaveLength(expected.length);
      for (const bibleRow of expected) {
        const key = columns[0];
        const dbRow = rows.find((row) => row[key] === bibleRow[key]);
        expect(dbRow, `${name}: missing row ${bibleRow[key]}`).toBeDefined();
        for (const column of columns) {
          expect(
            same(dbRow![column], bibleRow[column]),
            `${name}.${column} for ${bibleRow[key]}: database "${dbRow![column]}", Bible "${bibleRow[column]}"`,
          ).toBe(true);
        }
      }
    },
  );

  it("creates ai_calls with the fields lib/ai/call.ts records", async () => {
    const { rows } = await db.query<{ column_name: string }>(
      "select column_name from information_schema.columns where table_name = 'ai_calls'",
    );
    expect(rows.map((r) => r.column_name)).toEqual(
      expect.arrayContaining([
        "module",
        "feature",
        "model",
        "input_tokens",
        "output_tokens",
        "cost_usd",
        "latency_ms",
        "ok",
        "created_at",
      ]),
    );
  });
});
