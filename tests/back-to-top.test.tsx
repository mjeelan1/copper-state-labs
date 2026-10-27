import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BackToTop } from "@/components/copper/back-to-top";
import { stubIntersectionObserver } from "./fake-intersection-observer";

const button = () => screen.queryByRole("link", { name: "Back to top" });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("BackToTop", () => {
  it("stays hidden without IntersectionObserver", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    render(
      <>
        <section id="top" />
        <BackToTop />
      </>,
    );
    expect(button()).toBeNull();
  });

  it("shows once the hero scrolls out of view, and hides when it's back", () => {
    const report = stubIntersectionObserver();
    render(
      <>
        <section id="top" />
        <BackToTop />
      </>,
    );
    const hero = document.getElementById("top")!;
    expect(button()).toBeNull();

    report(hero, false);
    expect(button()).toHaveAttribute("href", "#top");

    report(hero, true);
    expect(button()).toBeNull();
  });
});
