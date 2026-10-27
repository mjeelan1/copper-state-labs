import { act } from "@testing-library/react";
import { vi } from "vitest";

// A stand-in for the browser's IntersectionObserver, which jsdom doesn't have.
// Returns a function that reports an element entering or leaving view.
export function stubIntersectionObserver() {
  let callback: IntersectionObserverCallback = () => {};
  class FakeObserver {
    constructor(cb: IntersectionObserverCallback) {
      callback = cb;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  vi.stubGlobal("IntersectionObserver", FakeObserver);
  return (target: Element, isIntersecting: boolean) =>
    act(() =>
      callback(
        [{ target, isIntersecting } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      ),
    );
}
