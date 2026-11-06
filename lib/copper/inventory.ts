// How many of each product color are on the shelf, and when the next shipment
// lands (Product Bible Section 10). Stock changes, so check_availability reads
// it fresh every time instead of remembering it.
// This is the only file that knows where stock is kept: since Module 2 part 2
// that's the Supabase `inventory` table (created by supabase/migrations/), so
// anyone with the Supabase login can change stock without a commit or a deploy.
import { createStatelessClient } from "@/lib/supabase/server";

/** One row of stock, named like the database columns it comes from. */
export type InventoryRow = {
  sku: string;
  product: string;
  color: string;
  units_in_stock: number;
  next_shipment: string;
};

/** Every stock row, or `null` when stock can't be read right now. */
export async function readInventory(): Promise<InventoryRow[] | null> {
  // Supabase isn't set up (no URL or key): say stock can't be checked.
  const supabase = createStatelessClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("inventory")
      .select("sku, product, color, units_in_stock, next_shipment")
      .order("sku");
    if (error || !data) {
      console.error(
        "[inventory] Supabase couldn't read stock:",
        error?.message ?? "no rows came back",
      );
      return null;
    }
    return data as InventoryRow[];
  } catch (error) {
    // The project is asleep, offline or unreachable.
    console.error(
      "[inventory] Supabase couldn't be reached:",
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}
