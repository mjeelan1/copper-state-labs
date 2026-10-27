import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Hero } from "@/components/copper/hero";
import { formatUsd, getProducts } from "@/lib/copper/catalog";

describe("Hero", () => {
  it("has the headline, the tagline and a See products link", () => {
    render(<Hero />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(
      screen.getByText("From raw ideas to refined answers."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See products" })).toHaveAttribute(
      "href",
      "#products",
    );
  });

  it("has a Compare plans link and a price hint from the catalog", () => {
    render(<Hero />);
    expect(screen.getByRole("link", { name: "Compare plans" })).toHaveAttribute(
      "href",
      "#plus",
    );
    const lowest = Math.min(
      ...getProducts().map((product) => product.priceUsd),
    );
    expect(screen.getByTestId("hero")).toHaveTextContent(
      `From ${formatUsd(lowest)}. No subscription needed.`,
    );
  });

  it("shows each product's cutout from the catalog", () => {
    render(<Hero />);
    for (const product of getProducts()) {
      const image = screen.getByAltText(new RegExp(product.name));
      // next/image rewrites src to /_next/image?url=<encoded path>.
      expect(decodeURIComponent(image.getAttribute("src") ?? "")).toContain(
        product.cutout,
      );
    }
  });
});
