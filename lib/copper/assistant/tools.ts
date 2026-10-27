// Module 2: the four tools Ask Copper can use. Products and prices come from
// lib/copper/catalog.ts and stock from lib/copper/inventory.ts, so the
// chatbot never has to make them up.
// The contract for each tool is in specs/module-2/spec.md.
import type { ToolSet } from "ai";
import { z } from "zod";
import type { Plan, ProductId } from "@/lib/copper/catalog";

export type ProductList = {
  products: {
    id: ProductId;
    name: string;
    type: string;
    priceUsd: number;
    colors: string[];
  }[];
};

export type Prices = {
  products: { id: ProductId; name: string; priceUsd: number }[];
  plans: { id: Plan["id"]; name: string; monthlyUsd: number; annualUsd: number }[];
};

export type CalculateCostInput = {
  products: ProductId[];
  plan: Plan["id"];
  billing: "monthly" | "annual";
  years: number;
};

export type CostBreakdown = {
  lines: { item: string; usd: number }[];
  totalUsd: number;
};

export type CheckAvailabilityInput = { product: ProductId; color?: string };

export type Stock = "in_stock" | "low_stock" | "backordered";

export type Availability =
  | {
      status: "ok";
      product: string;
      colors: { color: string; stock: Stock; restockDate: string | null }[];
    }
  | { status: "not_a_color"; product: string; color: string; colors: string[] }
  | { status: "unavailable"; message: string };

/** get_products: what Copper sells and which colors each one comes in. */
export function listProducts(): ProductList {
  // TODO (AC-M2.8): build this from getProducts(). It's called listProducts()
  // because the catalog already exports a getProducts().
  throw new Error("get_products isn't built yet");
}

/** get_prices: every product and plan price, read from the catalog. */
export function getPrices(): Prices {
  // TODO (AC-M2.8): build this from getProducts() and getPlans().
  throw new Error("get_prices isn't built yet");
}

// TODO (AC-M2.7): replace z.any() with a schema that only accepts the
// calculate_cost contract in spec.md.
export const calculateCostInput: z.ZodType<CalculateCostInput> = z.any();

/** calculate_cost: the total cost of devices plus a plan over some years. */
export function calculateCost(input: CalculateCostInput): CostBreakdown {
  // TODO (AC-M2.5, AC-M2.6): do the math with prices from the catalog.
  void input;
  throw new Error("calculate_cost isn't built yet");
}

// TODO (AC-M2.10): replace z.any() with a schema that only accepts the
// check_availability contract in spec.md.
export const checkAvailabilityInput: z.ZodType<CheckAvailabilityInput> =
  z.any();

/** check_availability: stock for one product (or one of its colors), read fresh each time. */
export async function checkAvailability(
  input: CheckAvailabilityInput,
): Promise<Availability> {
  // TODO (AC-M2.9, AC-M2.10): read the stock list with readInventory() from
  // lib/copper/inventory.ts, every time this runs.
  void input;
  throw new Error("check_availability isn't built yet");
}

// TODO (AC-M2.8): the tools the model can call, made with tool() from "ai":
// { get_products, get_prices, calculate_cost, check_availability }, each with
// a description and execute.
export const copperTools: ToolSet = {};
