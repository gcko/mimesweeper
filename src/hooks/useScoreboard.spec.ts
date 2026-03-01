import { act, renderHook } from "@testing-library/react";
import { useScoreboard } from "./useScoreboard.ts";

describe("useScoreboard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("initializes with default scoreboard entries", () => {
    const { result } = renderHook(() => useScoreboard());
    const smallScores = result.current.getScores("S");
    expect(smallScores).toHaveLength(10);
    expect(smallScores[0]).toEqual({ name: "JMS", score: 100 });
  });

  test("each difficulty has its own default entries", () => {
    const { result } = renderHook(() => useScoreboard());
    for (const key of ["S", "M", "L", "XL"] as const) {
      expect(result.current.getScores(key)).toHaveLength(10);
    }
  });

  test("persists defaults to localStorage on first load", () => {
    renderHook(() => useScoreboard());
    const stored = localStorage.getItem("mimesweeper-scoreboard");
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored as string);
    expect(parsed.S).toHaveLength(10);
  });

  test("isHighScore returns true when score beats lowest entry", () => {
    const { result } = renderHook(() => useScoreboard());
    expect(result.current.isHighScore("S", 200)).toBe(true);
  });

  test("isHighScore returns false when score is at or below lowest", () => {
    const { result } = renderHook(() => useScoreboard());
    expect(result.current.isHighScore("S", 50)).toBe(false);
  });

  test("isHighScore returns false when score equals lowest", () => {
    const { result } = renderHook(() => useScoreboard());
    expect(result.current.isHighScore("S", 100)).toBe(false);
  });

  test("addScore inserts entry in sorted order", () => {
    const { result } = renderHook(() => useScoreboard());
    act(() => {
      result.current.addScore("S", "ACE", 500);
    });
    const scores = result.current.getScores("S");
    expect(scores[0]).toEqual({ name: "ACE", score: 500 });
    expect(scores).toHaveLength(10);
  });

  test("addScore persists to localStorage", () => {
    const { result } = renderHook(() => useScoreboard());
    act(() => {
      result.current.addScore("M", "PRO", 9999);
    });
    const stored = localStorage.getItem("mimesweeper-scoreboard");
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored as string);
    expect(parsed.M[0]).toEqual({ name: "PRO", score: 9999 });
  });

  test("addScore trims list to 10 entries", () => {
    const { result } = renderHook(() => useScoreboard());
    act(() => {
      result.current.addScore("S", "NEW", 500);
    });
    expect(result.current.getScores("S")).toHaveLength(10);
  });

  test("loads existing scores from localStorage", () => {
    const custom = {
      S: [{ name: "TOP", score: 9999 }],
      M: [],
      L: [],
      XL: [],
    };
    localStorage.setItem("mimesweeper-scoreboard", JSON.stringify(custom));
    const { result } = renderHook(() => useScoreboard());
    expect(result.current.getScores("S")[0]).toEqual({
      name: "TOP",
      score: 9999,
    });
  });

  test("falls back to defaults on corrupted localStorage", () => {
    localStorage.setItem("mimesweeper-scoreboard", "not-json{{{");
    const { result } = renderHook(() => useScoreboard());
    expect(result.current.getScores("S")).toHaveLength(10);
  });
});
