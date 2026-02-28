import type { Coordinate, GameSquare } from "types.d";
import { coOrdKey } from "./coordinates.ts";

export function createTestSquare(
  overrides: Partial<GameSquare> = {},
): GameSquare {
  return {
    mime: false,
    adjacentMimes: 0,
    opened: false,
    flagged: false,
    isGameOver: false,
    x: 0,
    y: 0,
    ...overrides,
  };
}

export function createTestBoard(
  size: number,
  squareSide = 25,
): Map<Coordinate, GameSquare> {
  const board = new Map<Coordinate, GameSquare>();
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      board.set(
        coOrdKey(x, y),
        createTestSquare({ x: x * squareSide, y: y * squareSide }),
      );
    }
  }
  return board;
}
