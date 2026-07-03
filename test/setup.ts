import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// jsdom does not implement matchMedia. motion's useReducedMotion() (and any
// future prefers-reduced-motion consumer) reads it, so provide a default
// mock here (matches: false => motion enabled). Individual tests can
// override window.matchMedia to simulate prefers-reduced-motion: reduce.
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// jsdom does not implement ResizeObserver. Radix ScrollArea (and other
// size-tracking primitives) observe element resize to compute
// scrollbar/thumb geometry — provide a no-op mock so those components can
// mount in tests without crashing.
if (!window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
}
