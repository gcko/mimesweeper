import { computeSquareSide } from "./responsive";

describe("computeSquareSide", () => {
  test("fits squares to available width when possible", () => {
    // 390px viewport, 16px padding each side, gridSize 10
    // available = 390 - 32 = 358, 358 / 10 = 35.8 → floor = 35
    const result = computeSquareSide(390, 10);
    expect(result).toBe(35);
  });

  test("clamps to MIN_SQUARE_SIZE when computed size is too small", () => {
    // 390px viewport, gridSize 30
    // available = 358, 358 / 30 = 11.9 → floor = 11 → clamp to 28
    const result = computeSquareSide(390, 30);
    expect(result).toBe(28);
  });

  test("clamps to MAX_SQUARE_SIZE when viewport is very wide", () => {
    // 2560px viewport, gridSize 10
    // available = 2528, 2528 / 10 = 252.8 → floor = 252 → clamp to 40
    const result = computeSquareSide(2560, 10);
    expect(result).toBe(40);
  });

  test("returns MIN_SQUARE_SIZE for zero viewport", () => {
    const result = computeSquareSide(0, 10);
    expect(result).toBe(28);
  });

  test("handles typical mobile sizes", () => {
    // iPhone SE: 375px, Small grid (10)
    // available = 343, 343 / 10 = 34.3 → 34
    expect(computeSquareSide(375, 10)).toBe(34);

    // iPhone SE: 375px, Medium grid (20)
    // available = 343, 343 / 20 = 17.15 → 17 → clamp to 28
    expect(computeSquareSide(375, 20)).toBe(28);
  });

  test("handles typical desktop sizes", () => {
    // 1440px desktop, Small grid (10)
    // available = 1200 (max cap), 1200 / 10 = 120 → clamp to 40
    expect(computeSquareSide(1440, 10)).toBe(40);

    // 1440px desktop, XL grid (40)
    // available = 1200, 1200 / 40 = 30
    expect(computeSquareSide(1440, 40)).toBe(30);
  });
});
