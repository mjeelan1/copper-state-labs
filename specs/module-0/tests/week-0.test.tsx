import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

const DEFAULT_LINE = "Week 0 check-in: Hello from Copper State Labs!";

describe("Module 0 sample", () => {
  it("AC-0.1 The home page shows the Week 0 line", () => {
    render(<Home />);
    expect(screen.getByTestId("week-0-line")).toBeInTheDocument();
  });

  it("AC-0.2 The Week 0 line was changed from the default text", () => {
    render(<Home />);
    expect(screen.getByTestId("week-0-line").textContent?.trim()).not.toBe(
      DEFAULT_LINE,
    );
  });
});
