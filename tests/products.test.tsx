import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Products } from "@/components/copper/products";
import { formatUsd, getProducts } from "@/lib/copper/catalog";

const cardFor = (id: string) =>
  screen
    .getAllByTestId("product-card")
    .find((card) => card.dataset.product === id)!;

afterEach(() => {
  vi.doUnmock("@/lib/copper/catalog");
});

describe("Products", () => {
  it("is the products section, with one card per catalog product", () => {
    render(<Products />);
    expect(screen.getByTestId("products")).toHaveAttribute("id", "products");
    expect(
      screen.getAllByTestId("product-card").map((card) => card.dataset.product),
    ).toEqual(getProducts().map((product) => product.id));
  });

  it("shows each product's cutout, name, price, features and colors", () => {
    render(<Products />);
    for (const product of getProducts()) {
      const card = cardFor(product.id);
      const scope = within(card);
      expect(
        scope.getByRole("heading", { name: product.name }),
      ).toBeInTheDocument();
      expect(card).toHaveTextContent(formatUsd(product.priceUsd));
      for (const feature of product.features) {
        expect(card).toHaveTextContent(feature.name);
      }
      for (const color of product.colors) {
        expect(scope.getByText(color)).toBeInTheDocument();
      }
      // next/image rewrites src to /_next/image?url=<encoded path>.
      expect(
        decodeURIComponent(scope.getByRole("img").getAttribute("src") ?? ""),
      ).toContain(product.cutout);
    }
  });

  it("follows the catalog when prices change", async () => {
    vi.resetModules();
    vi.doMock("@/lib/copper/catalog", async (importOriginal) => {
      const actual =
        await importOriginal<typeof import("@/lib/copper/catalog")>();
      return {
        ...actual,
        getProducts: () =>
          actual
            .getProducts()
            .map((product) => ({
              ...product,
              priceUsd: product.priceUsd + 50,
            })),
      };
    });
    const { Products: Changed } = await import("@/components/copper/products");
    render(<Changed />);
    const section = screen.getByTestId("products");
    for (const product of getProducts()) {
      expect(section).toHaveTextContent(formatUsd(product.priceUsd + 50));
      expect(section).not.toHaveTextContent(formatUsd(product.priceUsd));
    }
  });
});
