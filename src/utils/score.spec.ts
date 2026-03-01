import { GridSize } from "../enums.ts";
import { decrementScore, getBaseScore } from "./score.ts";

describe("getBaseScore", () => {
  test("returns 1000 for GridSize.XS", () => {
    expect(getBaseScore(GridSize.XS)).toBe(1000);
  });

  test("returns 1000 for GridSize.S (small)", () => {
    expect(getBaseScore(GridSize.S)).toBe(1000);
  });

  test("returns 6000 for GridSize.M (medium)", () => {
    expect(getBaseScore(GridSize.M)).toBe(6000);
  });

  test("returns 11000 for GridSize.L (large)", () => {
    expect(getBaseScore(GridSize.L)).toBe(11000);
  });

  test("returns 16000 for GridSize.XL", () => {
    expect(getBaseScore(GridSize.XL)).toBe(16000);
  });
});

describe("decrementScore", () => {
  test("decrements by 5", () => {
    expect(decrementScore(1000)).toBe(995);
  });

  test("floors at 0", () => {
    expect(decrementScore(3)).toBe(0);
  });

  test("returns 0 when already 0", () => {
    expect(decrementScore(0)).toBe(0);
  });
});
