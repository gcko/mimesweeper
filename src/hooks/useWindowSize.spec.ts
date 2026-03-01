import { act, renderHook } from "@testing-library/react";
import { useWindowSize } from "./useWindowSize";

describe("useWindowSize", () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      value: originalInnerHeight,
    });
  });

  test("returns current window dimensions", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      value: 1024,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      value: 768,
    });

    const { result } = renderHook(() => useWindowSize());

    expect(result.current.width).toBe(1024);
    expect(result.current.height).toBe(768);
  });

  test("updates on window resize", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      value: 1024,
    });

    const { result } = renderHook(() => useWindowSize());
    expect(result.current.width).toBe(1024);

    act(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        value: 375,
      });
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current.width).toBe(375);
  });
});
