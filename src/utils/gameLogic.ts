import type {
  AdjacentProps,
  Coordinate,
  FlaggedAdjacentProps,
  GameSquare,
} from "types.d";
import { AdjacentUpdate } from "../enums.ts";
import { coOrdKey, generateRandomCoOrd } from "./coordinates.ts";
import { getNeighborCoords } from "./neighbors.ts";

export const INITIAL_FAILSAFE = 100;
export const SQUARE_SIDE = 25;

export interface ClickResult {
  openedCount: number;
  lost: boolean;
}

/**
 * Updates squares adjacent to the square at the given location.
 * Pass in the type to choose between updating adjacent mime
 * values, opening squares, or force-opening squares.
 * @returns number of squares that were opened
 */
export function updateAdjacent({
  location,
  upcomingGame,
  type = AdjacentUpdate.mimes,
}: AdjacentProps): number {
  let count = 0;
  for (const neighborCoord of getNeighborCoords(location)) {
    const square = upcomingGame.get(neighborCoord);
    if (!square) {
      continue;
    }
    if (type === AdjacentUpdate.mimes) {
      if (!square.mime) {
        (square as { adjacentMimes: number }).adjacentMimes += 1;
        upcomingGame.set(neighborCoord, square);
      }
    }
    if (!square.flagged && !square.opened) {
      if (type === AdjacentUpdate.open && !square.mime) {
        square.opened = true;
        count += 1;
        if (square.adjacentMimes === 0) {
          count += updateAdjacent({
            location: neighborCoord,
            upcomingGame,
            type: AdjacentUpdate.open,
          });
        }
      } else if (type === AdjacentUpdate.forceOpen) {
        square.opened = true;
        count += 1;
      }
    }
  }
  return count;
}

/** Checks whether all adjacent mines around a square are flagged. */
export function allAdjacentMimesAreFlagged({
  location,
  upcomingGame,
}: FlaggedAdjacentProps): boolean {
  let flaggedAdjacent = 0;
  let adjacentMimes = 0;
  for (const neighborCoord of getNeighborCoords(location)) {
    const square = upcomingGame.get(neighborCoord);
    if (square?.mime) {
      adjacentMimes += 1;
      if (square.flagged) {
        flaggedAdjacent += 1;
      }
    }
  }
  return flaggedAdjacent === adjacentMimes;
}

export function populateMimes(
  entries: [Coordinate, GameSquare][],
  numMimes: number,
  boardSize: number,
  currentPieceCoOrds: Coordinate = "-1|-1",
): Map<Coordinate, GameSquare> {
  const mimeLocations = new Set<Coordinate>();
  let failSafe = numMimes * INITIAL_FAILSAFE;
  while (mimeLocations.size < numMimes && failSafe > 0) {
    const candidate = generateRandomCoOrd(boardSize);
    if (candidate !== currentPieceCoOrds) {
      mimeLocations.add(candidate);
    }
    failSafe -= 1;
  }
  const upcomingGame = new Map<Coordinate, GameSquare>(entries);
  for (const mimeLocation of mimeLocations) {
    const square = upcomingGame.get(mimeLocation);
    if (square) {
      square.mime = true;
      upcomingGame.set(mimeLocation, square);
    }
  }
  for (const mimeLocation of mimeLocations) {
    const square = upcomingGame.get(mimeLocation);
    if (square) {
      updateAdjacent({ location: mimeLocation, upcomingGame });
    }
  }
  return upcomingGame;
}

export function newGame(
  size: number,
  squareSide: number,
): Map<Coordinate, GameSquare> {
  const game = new Map<Coordinate, GameSquare>();
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      game.set(coOrdKey(x, y), {
        mime: false,
        adjacentMimes: 0,
        opened: false,
        flagged: false,
        x: x * squareSide,
        y: y * squareSide,
      });
    }
  }
  return game;
}

/**
 * Toggles the flagged state of a square.
 * @returns flag count delta: -1 if flagged, +1 if unflagged, 0 if no-op
 */
export function processRightClick(square: GameSquare): number {
  if (!square.opened) {
    square.flagged = !square.flagged;
    return square.flagged ? -1 : 1;
  }
  return 0;
}

/**
 * Processes a left-click on a square.
 * Mutates the square and game map. Returns the result.
 */
export function processSquareClick(
  coOrd: Coordinate,
  nextStateGame: Map<Coordinate, GameSquare>,
  square: GameSquare,
): ClickResult {
  if (square.mime && !square.flagged) {
    square.opened = true;
    return { openedCount: 0, lost: true };
  }
  if (!square.flagged) {
    let count = 0;
    if (!square.opened) {
      square.opened = true;
      count += 1;
    }
    if (square.adjacentMimes === 0) {
      count += updateAdjacent({
        location: coOrd,
        upcomingGame: nextStateGame,
        type: AdjacentUpdate.open,
      });
    }
    return { openedCount: count, lost: false };
  }
  return { openedCount: 0, lost: false };
}

/**
 * Processes a double-click on a square.
 * Force-opens adjacent squares. Returns the result.
 */
export function processDoubleClick(
  coOrd: Coordinate,
  nextStateGame: Map<Coordinate, GameSquare>,
  square: GameSquare,
): ClickResult {
  if (square.opened && square.adjacentMimes > 0) {
    const lost = !allAdjacentMimesAreFlagged({
      location: coOrd,
      upcomingGame: nextStateGame,
    });
    const openedCount = updateAdjacent({
      location: coOrd,
      upcomingGame: nextStateGame,
      type: AdjacentUpdate.forceOpen,
    });
    return { openedCount, lost };
  }
  return { openedCount: 0, lost: false };
}

/** Checks if all non-mine squares have been opened. */
export function isWin(
  numMimes: number,
  numOpenSpaces: number,
  boardSize: number,
): boolean {
  return numMimes + numOpenSpaces === boardSize * boardSize;
}
