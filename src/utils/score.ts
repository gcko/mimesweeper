import { GridSize } from "../enums.ts";

const BASE_SCORE = 1000;
const MULTIPLIER = 5;
const DECREMENT_PER_SECOND = 5;

const difficultyMultiplier: Record<GridSize, number> = {
  [GridSize.XS]: 0,
  [GridSize.S]: 0,
  [GridSize.M]: 1,
  [GridSize.L]: 2,
  [GridSize.XL]: 3,
};

export function getBaseScore(gridSize: GridSize): number {
  const mult = difficultyMultiplier[gridSize] ?? 0;
  return BASE_SCORE + BASE_SCORE * MULTIPLIER * mult;
}

export function decrementScore(currentScore: number): number {
  return Math.max(0, currentScore - DECREMENT_PER_SECOND);
}
