import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("Accessibility", () => {
  it("starts with a skip link that jumps to the main content", () => {
    const { container } = render(<Home />);
    const skip = screen.getByRole("link", { name: "Skip to content" });
    expect(container.querySelector("a")).toBe(skip);
    expect(skip).toHaveAttribute("href", "#main");
    expect(screen.getByRole("main")).toHaveAttribute("id", "main");
  });
});
