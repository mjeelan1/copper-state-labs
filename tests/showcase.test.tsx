import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Showcase } from "@/components/copper/showcase";
import { getProducts } from "@/lib/copper/catalog";

describe("Showcase", () => {
  it("is the showcase section", () => {
    render(<Showcase />);
    expect(screen.getByTestId("showcase")).toHaveAttribute("id", "showcase");
  });

  it("shows every catalog lifestyle photo with a caption and a description", () => {
    render(<Showcase />);
    const paths = getProducts().flatMap((product) => product.lifestyle);
    const figures = screen.getAllByRole("figure");
    expect(figures).toHaveLength(paths.length);
    paths.forEach((path, index) => {
      const image = within(figures[index]).getByRole("img");
      // next/image rewrites src to /_next/image?url=<encoded path>.
      expect(decodeURIComponent(image.getAttribute("src") ?? "")).toContain(
        path,
      );
      const alt = image.getAttribute("alt") ?? "";
      expect(alt.split(" ").length).toBeGreaterThan(3);
      expect(alt).not.toMatch(/\.png$/);
      const caption = figures[index].querySelector("figcaption");
      expect(caption?.textContent?.trim()).toBeTruthy();
    });
  });
});
