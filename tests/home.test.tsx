import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("Placeholder home page", () => {
  it("shows the logo, heading and under-construction line", () => {
    render(<Home />);
    expect(screen.getAllByAltText("Copper State Labs").length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Copper State Labs" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Our new site is under construction."),
    ).toBeInTheDocument();
  });

  it("has the Week 0 line students edit", () => {
    render(<Home />);
    expect(screen.getByTestId("week-0-line")).toHaveTextContent(/\S/);
  });

  it("has the fictional-use footer", () => {
    render(<Home />);
    expect(screen.getByRole("contentinfo")).toHaveTextContent(
      "Fictional — for educational use.",
    );
  });
});
