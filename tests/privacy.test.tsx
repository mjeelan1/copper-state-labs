import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Privacy } from "@/components/copper/privacy";
import { getPrivacySummary } from "@/lib/copper/catalog";

const listedPoints = () =>
  screen.getAllByRole("listitem").map((item) => item.textContent);

afterEach(() => {
  vi.doUnmock("@/lib/copper/catalog");
});

describe("Privacy", () => {
  it("is the privacy-summary section", () => {
    render(<Privacy />);
    expect(screen.getByTestId("privacy-summary")).toHaveAttribute(
      "id",
      "privacy",
    );
  });

  it("shows the policy year, the wake word and every catalog point", () => {
    render(<Privacy />);
    const { policy, wakeWord, points } = getPrivacySummary();
    const section = screen.getByTestId("privacy-summary");
    expect(section).toHaveTextContent(`${policy} privacy policy`);
    expect(section).toHaveTextContent(wakeWord);
    expect(listedPoints()).toEqual(points);
    expect(section).not.toHaveTextContent(/never\s+record/i);
  });

  it("follows the catalog when the policy changes", async () => {
    vi.resetModules();
    vi.doMock("@/lib/copper/catalog", async (importOriginal) => {
      const actual =
        await importOriginal<typeof import("@/lib/copper/catalog")>();
      return {
        ...actual,
        getPrivacySummary: () => ({
          policy: "2027",
          wakeWord: "Hi Copper",
          points: ["A new first point.", "A new second point."],
        }),
      };
    });
    const { Privacy: Changed } = await import("@/components/copper/privacy");
    render(<Changed />);
    const section = screen.getByTestId("privacy-summary");
    expect(section).toHaveTextContent("2027 privacy policy");
    expect(section).toHaveTextContent("Hi Copper");
    expect(listedPoints()).toEqual([
      "A new first point.",
      "A new second point.",
    ]);
  });
});
