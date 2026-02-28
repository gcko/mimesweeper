import { coOrdKey, generateRandomCoOrd, getCoOrd } from "./coordinates.ts";

describe("coOrdKey", () => {
  test("returns pipe-separated coordinate string", () => {
    expect(coOrdKey(5, 4)).toBe("5|4");
  });

  test("handles zero values", () => {
    expect(coOrdKey(0, 0)).toBe("0|0");
  });

  test("handles negative values", () => {
    expect(coOrdKey(-1, -3)).toBe("-1|-3");
  });

  test("handles large values", () => {
    expect(coOrdKey(100, 200)).toBe("100|200");
  });
});

describe("generateRandomCoOrd", () => {
  test("returns a valid coordinate within board bounds", () => {
    const boardSize = 10;
    for (let i = 0; i < 50; i++) {
      const coord = generateRandomCoOrd(boardSize);
      const [x, y] = getCoOrd(coord);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(boardSize);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThan(boardSize);
    }
  });

  test("returns pipe-separated format", () => {
    const coord = generateRandomCoOrd(5);
    expect(coord).toMatch(/^\d+\|\d+$/);
  });

  test("works with board size of 1", () => {
    const coord = generateRandomCoOrd(1);
    expect(coord).toBe("0|0");
  });
});

describe("getCoOrd", () => {
  test("parses valid coordinate string", () => {
    expect(getCoOrd("5|4")).toEqual([5, 4]);
  });

  test("parses zero coordinates", () => {
    expect(getCoOrd("0|0")).toEqual([0, 0]);
  });

  test("parses negative coordinates", () => {
    expect(getCoOrd("-1|-3")).toEqual([-1, -3]);
  });

  test("parses multi-digit coordinates", () => {
    expect(getCoOrd("12|34")).toEqual([12, 34]);
  });

  test("throws on invalid format — no pipe", () => {
    expect(() => getCoOrd("invalid" as `${string}|${string}`)).toThrow(
      "Unable to correctly parse",
    );
  });

  test("throws on non-numeric x value", () => {
    expect(() => getCoOrd("abc|5")).toThrow("Unable to correctly parse");
  });

  test("throws on non-numeric y value", () => {
    expect(() => getCoOrd("5|abc")).toThrow("Unable to correctly parse");
  });

  test("throws on empty string with pipe", () => {
    expect(() => getCoOrd("|")).toThrow("Unable to correctly parse");
  });
});
