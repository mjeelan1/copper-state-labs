import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlusPricing } from "@/components/copper/plus-pricing";
import {
  formatMemory,
  formatNotesHours,
  formatUsd,
  getPlans,
} from "@/lib/copper/catalog";

afterEach(() => {
  vi.doUnmock("@/lib/copper/catalog");
});

describe("PlusPricing", () => {
  it("is the plus-pricing section, with one card per catalog plan", () => {
    const { container } = render(<PlusPricing />);
    expect(screen.getByTestId("plus-pricing")).toHaveAttribute("id", "plus");
    expect(
      [...container.querySelectorAll("[data-plan]")].map((card) =>
        card.getAttribute("data-plan"),
      ),
    ).toEqual(getPlans().map((plan) => plan.id));
  });

  it("shows each plan's prices and details from the catalog", () => {
    const { container } = render(<PlusPricing />);
    for (const plan of getPlans()) {
      const card = container.querySelector<HTMLElement>(
        `[data-plan="${plan.id}"]`,
      )!;
      expect(
        within(card).getByRole("heading", { name: plan.name }),
      ).toBeInTheDocument();
      expect(card).toHaveTextContent(formatUsd(plan.monthlyUsd));
      if (plan.monthlyUsd > 0) {
        expect(card).toHaveTextContent(`${formatUsd(plan.annualUsd)}/year`);
      }
      expect(card).toHaveTextContent(formatMemory(plan.memoryDays));
      expect(card).toHaveTextContent(formatNotesHours(plan.notesHoursPerMonth));
      const refined = within(card).getByText("Refined answers").closest("div");
      expect(refined).toHaveTextContent(
        plan.refinedAnswers ? /Included$/ : /Not included$/,
      );
    }
  });

  it("switches between monthly and annual billing, keeping both prices", () => {
    const { container } = render(<PlusPricing />);
    const plus = getPlans().find((plan) => plan.monthlyUsd > 0)!;
    const card = container.querySelector<HTMLElement>(
      `[data-plan="${plus.id}"]`,
    )!;
    const saving =
      Math.round((plus.monthlyUsd * 12 - plus.annualUsd) * 100) / 100;
    const percent = Math.round((saving / (plus.monthlyUsd * 12)) * 100);
    const monthly = screen.getByRole("button", { name: "Monthly" });
    const annual = screen.getByRole("button", {
      name: `Annual · save ${percent}%`,
    });

    expect(monthly).toHaveAttribute("aria-pressed", "true");
    expect(card).toHaveTextContent(`${formatUsd(plus.monthlyUsd)}/month`);
    expect(card).toHaveTextContent(
      `or ${formatUsd(plus.annualUsd)}/year · save ${formatUsd(saving)}`,
    );

    fireEvent.click(annual);
    expect(annual).toHaveAttribute("aria-pressed", "true");
    expect(monthly).toHaveAttribute("aria-pressed", "false");
    const perMonth = Math.round((plus.annualUsd / 12) * 100) / 100;
    expect(card).toHaveTextContent(`${formatUsd(plus.annualUsd)}/year`);
    expect(card).toHaveTextContent(
      `That’s ${formatUsd(perMonth)}/month · or ${formatUsd(plus.monthlyUsd)} monthly`,
    );
  });

  it("links on to the privacy promise", () => {
    render(<PlusPricing />);
    expect(
      screen.getByRole("link", { name: "Read our privacy promise" }),
    ).toHaveAttribute("href", "#privacy");
  });

  it("follows the catalog when Copper Plus prices change", async () => {
    vi.resetModules();
    vi.doMock("@/lib/copper/catalog", async (importOriginal) => {
      const actual =
        await importOriginal<typeof import("@/lib/copper/catalog")>();
      return {
        ...actual,
        getPlans: () =>
          actual
            .getPlans()
            .map((plan) =>
              plan.id === "copper-plus"
                ? { ...plan, monthlyUsd: 9.49, annualUsd: 95 }
                : plan,
            ),
      };
    });
    const { PlusPricing: Changed } =
      await import("@/components/copper/plus-pricing");
    render(<Changed />);
    const section = screen.getByTestId("plus-pricing");
    expect(section).toHaveTextContent("$9.49");
    expect(section).toHaveTextContent("$95/year");
    expect(section).not.toHaveTextContent("$7.99");
    expect(section).not.toHaveTextContent("$79");
  });
});
