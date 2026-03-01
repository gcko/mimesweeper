import { renderHook } from "@testing-library/react";
import useInterval from "./useInterval";

describe("useInterval", () => {
  let setIntervalSpy: ReturnType<typeof vi.spyOn>;
  let clearIntervalSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    setIntervalSpy = vi.spyOn(globalThis, "setInterval");
    clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
  });

  afterEach(() => {
    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });

  test("sets up interval with correct delay", () => {
    const callback = vi.fn();
    renderHook(() => useInterval(callback, 1000));

    const relevantCalls = setIntervalSpy.mock.calls.filter(
      ([, delay]: [unknown, unknown]) => delay === 1000,
    );
    expect(relevantCalls).toHaveLength(1);
  });

  test("does not set interval when delay is null", () => {
    const callback = vi.fn();
    const callsBefore = setIntervalSpy.mock.calls.length;
    renderHook(() => useInterval(callback, null));

    // No new setInterval calls with any delay should be made by our hook
    const callsAfter = setIntervalSpy.mock.calls.length;
    expect(callsAfter).toBe(callsBefore);
  });

  test("sets interval when delay is 0", () => {
    const callback = vi.fn();
    renderHook(() => useInterval(callback, 0));

    const relevantCalls = setIntervalSpy.mock.calls.filter(
      ([, delay]: [unknown, unknown]) => delay === 0,
    );
    expect(relevantCalls).toHaveLength(1);
  });

  test("clears interval on unmount", () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useInterval(callback, 1000));

    const clearCallsBefore = clearIntervalSpy.mock.calls.length;
    unmount();
    const clearCallsAfter = clearIntervalSpy.mock.calls.length;

    expect(clearCallsAfter).toBeGreaterThan(clearCallsBefore);
  });

  test("clears and restarts interval when delay changes", () => {
    const callback = vi.fn();
    const { rerender } = renderHook(
      ({ delay }) => useInterval(callback, delay),
      { initialProps: { delay: 1000 as number | null } },
    );

    const clearCallsBefore = clearIntervalSpy.mock.calls.length;
    rerender({ delay: 500 });

    // Old interval should be cleared
    expect(clearIntervalSpy.mock.calls.length).toBeGreaterThan(
      clearCallsBefore,
    );
    // New interval should be set with delay 500
    const relevantCalls = setIntervalSpy.mock.calls.filter(
      ([, delay]: [unknown, unknown]) => delay === 500,
    );
    expect(relevantCalls).toHaveLength(1);
  });

  test("clears interval when delay changes to null", () => {
    const callback = vi.fn();
    const { rerender } = renderHook(
      ({ delay }) => useInterval(callback, delay),
      { initialProps: { delay: 1000 as number | null } },
    );

    const clearCallsBefore = clearIntervalSpy.mock.calls.length;
    rerender({ delay: null });

    expect(clearIntervalSpy.mock.calls.length).toBeGreaterThan(
      clearCallsBefore,
    );
  });

  test("calls the latest callback ref", () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const { rerender } = renderHook(({ cb }) => useInterval(cb, 1000), {
      initialProps: { cb: callback1 },
    });

    // Rerender with new callback — interval should NOT restart
    // (same delay, so setInterval count shouldn't increase)
    const setCallsBefore = setIntervalSpy.mock.calls.filter(
      ([, delay]: [unknown, unknown]) => delay === 1000,
    ).length;

    rerender({ cb: callback2 });

    const setCallsAfter = setIntervalSpy.mock.calls.filter(
      ([, delay]: [unknown, unknown]) => delay === 1000,
    ).length;

    // Callback change should NOT cause a new setInterval
    expect(setCallsAfter).toBe(setCallsBefore);
  });
});
