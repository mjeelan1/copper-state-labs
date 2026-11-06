// Module 2: the four tools Ask Copper can use. Products and prices come from
// lib/copper/catalog.ts and stock from lib/copper/inventory.ts, so the
// chatbot never has to make them up.
// The contract for each tool is in specs/module-2/spec.md.
import { tool, type ToolSet } from "ai";
import { z } from "zod";
import {
  getPlans,
  getProducts,
  type Plan,
  type ProductId,
} from "@/lib/copper/catalog";
import { readInventory } from "@/lib/copper/inventory";

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
  plans: {
    id: Plan["id"];
    name: string;
    monthlyUsd: number;
    annualUsd: number;
  }[];
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

// The ids the contract allows: Copper's two products and two plans.
const productId = z.enum(["copper-home", "copper-notes"]);
const planId = z.enum(["free", "copper-plus"]);

// Rounds to the cent, so 7.99 × 12 shows as 95.88.
const cents = (usd: number) => Math.round(usd * 100) / 100;

/** get_products: what Copper sells and which colors each one comes in. */
export function listProducts(): ProductList {
  return {
    products: getProducts().map(({ id, name, type, priceUsd, colors }) => ({
      id,
      name,
      type,
      priceUsd,
      colors,
    })),
  };
}

/** get_prices: every product and plan price, read from the catalog. */
export function getPrices(): Prices {
  return {
    products: getProducts().map(({ id, name, priceUsd }) => ({
      id,
      name,
      priceUsd,
    })),
    plans: getPlans().map(({ id, name, monthlyUsd, annualUsd }) => ({
      id,
      name,
      monthlyUsd,
      annualUsd,
    })),
  };
}

export const calculateCostInput: z.ZodType<CalculateCostInput> = z.object({
  products: z
    .array(productId)
    .max(5)
    .describe("The devices, 0 to 5. List a device twice to buy two."),
  plan: planId.describe("The subscription plan."),
  billing: z.enum(["monthly", "annual"]).describe("How the plan is paid for."),
  years: z
    .number()
    .int()
    .min(1)
    .max(5)
    .describe("How many years to total up, 1 to 5."),
});

/** calculate_cost: the total cost of devices plus a plan over some years. */
export function calculateCost(input: CalculateCostInput): CostBreakdown {
  const products = getProducts();
  const lines = input.products.map((id) => {
    const product = products.find((p) => p.id === id);
    if (!product) throw new Error(`${id} isn't a Copper product`);
    return { item: product.name, usd: cents(product.priceUsd) };
  });

  const plan = getPlans().find((p) => p.id === input.plan);
  if (!plan) throw new Error(`${input.plan} isn't a Copper plan`);
  // One plan covers the whole household, however many devices there are.
  const planUsd =
    input.billing === "monthly"
      ? plan.monthlyUsd * 12 * input.years
      : plan.annualUsd * input.years;
  if (planUsd > 0) {
    const years = input.years === 1 ? "1 year" : `${input.years} years`;
    lines.push({
      item: `${plan.name}, ${input.billing}, ${years}`,
      usd: cents(planUsd),
    });
  }

  const totalUsd = cents(lines.reduce((sum, line) => sum + line.usd, 0));
  return { lines, totalUsd };
}

export const checkAvailabilityInput: z.ZodType<CheckAvailabilityInput> =
  z.object({
    product: productId.describe("The product to check."),
    color: z
      .string()
      .optional()
      .describe("One color, in any capitalization. Leave out for every color."),
  });

const stockOf = (units: number): Stock =>
  units <= 0 ? "backordered" : units < 10 ? "low_stock" : "in_stock";

/** check_availability: stock for one product (or one of its colors), read fresh each time. */
export async function checkAvailability(
  input: CheckAvailabilityInput,
): Promise<Availability> {
  const product = getProducts().find((p) => p.id === input.product);
  if (!product) throw new Error(`${input.product} isn't a Copper product`);

  // Which colors to check, in the catalog's own spelling. A color the product
  // doesn't come in is answered from the catalog, before stock is read.
  const asked = input.color?.trim();
  const colors = asked
    ? product.colors.filter((c) => c.toLowerCase() === asked.toLowerCase())
    : product.colors;
  if (asked && colors.length === 0) {
    return {
      status: "not_a_color",
      product: product.name,
      color: asked,
      colors: product.colors,
    };
  }

  // Stock changes, so it's read fresh every time. Rows name the product.
  const rows = await readInventory();
  if (!rows) {
    return {
      status: "unavailable",
      message:
        "Stock can't be checked right now. Please try again in a little while.",
    };
  }
  return {
    status: "ok",
    product: product.name,
    colors: colors.flatMap((color) => {
      const row = rows.find(
        (r) =>
          r.product === product.name &&
          r.color.toLowerCase() === color.toLowerCase(),
      );
      if (!row) return [];
      const stock = stockOf(row.units_in_stock);
      return [
        {
          color,
          stock,
          restockDate: stock === "backordered" ? row.next_shipment : null,
        },
      ];
    }),
  };
}

export const copperTools = {
  get_products: tool({
    description:
      "Lists every Copper product with its type, price and the colors it comes in; use it for what Copper sells and which colors exist, not for stock.",
    inputSchema: z.object({}),
    execute: async () => listProducts(),
  }),
  get_prices: tool({
    description:
      "Returns the current price of every Copper product and the monthly and annual price of every plan.",
    inputSchema: z.object({}),
    execute: async () => getPrices(),
  }),
  calculate_cost: tool({
    description:
      "Works out the exact total for some devices plus a plan, billing period and number of years; Copper Plus covers the whole household, so it is counted once.",
    inputSchema: calculateCostInput,
    execute: async (input) => calculateCost(input),
  }),
  check_availability: tool({
    description:
      "Checks today's stock for one Copper product, or one of its colors: in stock, low stock, or back-ordered with its restock date.",
    inputSchema: checkAvailabilityInput,
    execute: (input) => checkAvailability(input),
  }),
} satisfies ToolSet;
