// Module 2 part 2: readInventory() reads stock from the Supabase inventory
// table. These tests use a fake Supabase client, so they need no project, no
// key and no network.
import { afterEach, describe, expect, it, vi } from "vitest";

// What the fake Supabase client does when the app asks for stock.
type Answer =
  | { data: unknown[] | null; error: { message: string } | null }
  | "throws";
let configured = true;
let answer: Answer;
const asked: { table?: string; columns?: string; orderBy?: string } = {};

vi.mock("@/lib/supabase/server", () => ({
  createStatelessClient: () =>
    configured
      ? {
          from: (table: string) => {
            asked.table = table;
            return {
              select: (columns: string) => {
                asked.columns = columns;
                return {
                  order: async (column: string) => {
                    asked.orderBy = column;
                    if (answer === "throws") throw new Error("fetch failed");
                    return answer;
                  },
                };
              },
            };
          },
        }
      : null,
}));

const ROWS = [
  {
    sku: "CN-NSK",
    product: "Copper Notes",
    color: "Night Sky",
    units_in_stock: 0,
    next_shipment: "2026-11-14",
  },
  {
    sku: "CH-TEA",
    product: "Copper Home",
    color: "Patina Teal",
    units_in_stock: 6,
    next_shipment: "2026-11-06",
  },
];

async function readInventory() {
  vi.resetModules();
  return (await import("@/lib/copper/inventory")).readInventory();
}

afterEach(() => {
  configured = true;
  vi.restoreAllMocks();
});

describe("readInventory (Supabase)", () => {
  it("returns every row of the Supabase inventory table", async () => {
    answer = { data: ROWS, error: null };
    expect(await readInventory()).toEqual(ROWS);
    expect(asked).toEqual({
      table: "inventory",
      columns: "sku, product, color, units_in_stock, next_shipment",
      orderBy: "sku",
    });
  });

  it("returns null when Supabase isn't set up", async () => {
    configured = false;
    expect(await readInventory()).toBeNull();
  });

  it("returns null, and says why in the terminal, when Supabase answers with an error", async () => {
    const printed = vi.spyOn(console, "error").mockImplementation(() => {});
    answer = { data: null, error: { message: 'relation "inventory" does not exist' } };
    expect(await readInventory()).toBeNull();
    expect(printed.mock.calls.flat().join(" ")).toContain("does not exist");
  });

  it("returns null when Supabase can't be reached", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    answer = "throws";
    expect(await readInventory()).toBeNull();
  });

  it("no longer ships a stock file with the app", async () => {
    const { existsSync } = await import("node:fs");
    expect(existsSync("lib/copper/data/inventory.json")).toBe(false);
  });
});
