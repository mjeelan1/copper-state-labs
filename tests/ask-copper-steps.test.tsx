import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Answer,
  formatRestockDate,
  Markdown,
  statusLine,
} from "@/components/copper/ask-copper-steps";
import type { Progress } from "@/lib/copper/assistant/progress";

const working = (overrides: Partial<Progress> = {}): Progress => ({
  steps: [],
  reply: "",
  status: "working",
  ...overrides,
});

describe("Ask Copper stations", () => {
  it("says what Copper is doing right now", () => {
    expect(statusLine(working(), true)).toBe("Reading your question…");
    expect(
      statusLine(working({ steps: [{ type: "thinking", text: "Hmm" }] }), true),
    ).toBe("Deciding what to do next…");
    expect(statusLine(working(), false)).toBe("Answering from memory…");
    expect(statusLine(working({ reply: "That" }), true)).toBe(
      "Writing the answer…",
    );
  });

  it("writes restock dates out in words", () => {
    expect(formatRestockDate("2026-11-14")).toBe("Nov 14, 2026");
    expect(formatRestockDate("soon")).toBe("soon");
  });

  it("shows Gemini's bold and code instead of the marks", () => {
    const { container } = render(
      <Markdown
        text={"**Checking stock**\n\nI'll use `check_availability`."}
      />,
    );
    expect(container.querySelector("strong")).toHaveTextContent(
      "Checking stock",
    );
    expect(container.querySelector("code")).toHaveTextContent(
      "check_availability",
    );
    expect(container.textContent).not.toMatch(/\*\*|`/);
  });

  it("shows a stock card with a back-order date and fills in the tool it used", () => {
    render(
      <Answer
        useTools
        progress={{
          status: "done",
          reply: "Night Sky is back-ordered.",
          steps: [
            {
              type: "tool",
              id: "1",
              name: "check_availability",
              state: "done",
              input: { product: "copper-notes", color: "Night Sky" },
              output: {
                status: "ok",
                product: "Copper Notes",
                colors: [
                  {
                    color: "Night Sky",
                    stock: "backordered",
                    restockDate: "2026-11-14",
                  },
                ],
              },
            },
          ],
        }}
      />,
    );
    const card = within(screen.getByTestId("tool-call"));
    expect(card.getByText("Copper Notes")).toBeInTheDocument();
    expect(
      card.getByText(/Back-ordered until Nov 14, 2026/),
    ).toBeInTheDocument();
    expect(screen.getByText("Tools Copper can use")).toBeInTheDocument();
  });

  it("explains a color the product doesn't come in", () => {
    render(
      <Answer
        useTools
        progress={{
          status: "done",
          reply: "No.",
          steps: [
            {
              type: "tool",
              id: "1",
              name: "check_availability",
              state: "done",
              input: { product: "copper-notes", color: "Patina Teal" },
              output: {
                status: "not_a_color",
                product: "Copper Notes",
                color: "Patina Teal",
                colors: ["Brushed Copper", "Desert Sand", "Night Sky"],
              },
            },
          ],
        }}
      />,
    );
    expect(
      screen.getByText(
        "Copper Notes doesn’t come in Patina Teal. It comes in Brushed Copper, Desert Sand and Night Sky.",
      ),
    ).toBeInTheDocument();
  });

  it("shows a compare_billing card with both totals, the cheaper one and the savings", () => {
    render(
      <Answer
        useTools
        progress={{
          status: "done",
          reply: "Yearly is cheaper.",
          steps: [
            {
              type: "tool",
              id: "1",
              name: "compare_billing",
              state: "done",
              input: { plan: "copper-plus", years: 1 },
              output: {
                plan: "Copper Plus",
                years: 1,
                monthlyTotalUsd: 95.88,
                annualTotalUsd: 79,
                cheaper: "annual",
                savingsUsd: 16.88,
              },
            },
          ],
        }}
      />,
    );
    const card = within(screen.getByTestId("tool-call"));
    expect(card.getByText("Comparing monthly and yearly")).toBeInTheDocument();
    expect(card.getByText("Copper Plus")).toBeInTheDocument();
    expect(card.getByText("Copper Plus over 1 year")).toBeInTheDocument();
    expect(card.getByText("$95.88")).toBeInTheDocument();
    expect(card.getByText("$79")).toBeInTheDocument();
    expect(card.getByText("Paid yearly")).toHaveTextContent("Cheaper");
    expect(card.getByText("You save")).toBeInTheDocument();
    expect(card.getByText("$16.88")).toBeInTheDocument();
  });

  it("says when monthly and yearly cost the same", () => {
    render(
      <Answer
        useTools
        progress={{
          status: "done",
          reply: "Free is free.",
          steps: [
            {
              type: "tool",
              id: "1",
              name: "compare_billing",
              state: "done",
              input: { plan: "free", years: 2 },
              output: {
                plan: "Free",
                years: 2,
                monthlyTotalUsd: 0,
                annualTotalUsd: 0,
                cheaper: "same",
                savingsUsd: 0,
              },
            },
          ],
        }}
      />,
    );
    expect(screen.getByText("Both ways cost the same")).toBeInTheDocument();
    expect(screen.queryByText("You save")).toBeNull();
    expect(screen.queryByText("Cheaper")).toBeNull();
  });

  it("marks a tools-off answer and lists no tools", () => {
    render(
      <Answer
        useTools={false}
        progress={{ status: "done", reply: "About $300.", steps: [] }}
      />,
    );
    expect(screen.getByText("Tools given to Copper: none")).toBeInTheDocument();
    expect(
      screen.getByText("Answered without tools: may be made up"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("tool-call")).toBeNull();
  });
});
