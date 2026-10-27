import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SectionNav } from "@/components/copper/section-nav";
import { stubIntersectionObserver } from "./fake-intersection-observer";

const LINKS = ["Products", "Copper Plus", "Privacy"];
const link = (name: string) => screen.getByRole("link", { name });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SectionNav", () => {
  it("marks no link as current without IntersectionObserver", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    render(<SectionNav />);
    for (const name of LINKS) {
      expect(link(name)).not.toHaveAttribute("aria-current");
    }
  });

  it("marks the link for the section in view as current", () => {
    const report = stubIntersectionObserver();
    render(
      <>
        <SectionNav />
        <section id="products" />
        <section id="plus" />
        <section id="privacy" />
      </>,
    );

    report(document.getElementById("plus")!, true);
    expect(link("Copper Plus")).toHaveAttribute("aria-current", "true");
    expect(link("Products")).not.toHaveAttribute("aria-current");

    report(document.getElementById("plus")!, false);
    for (const name of LINKS) {
      expect(link(name)).not.toHaveAttribute("aria-current");
    }
  });
});
