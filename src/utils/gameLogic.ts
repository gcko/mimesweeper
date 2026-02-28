import type {
  AdjacentProps,
  Coordinate,
  FlaggedAdjacentProps,
  GameSquare,
} from "types.d";
import { AdjacentUpdate } from "../enums.ts";
import { coOrdKey, generateRandomCoOrd, getCoOrd } from "./coordinates.ts";

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
  const [x, y] = getCoOrd(location);
  Array.of(x - 1, x, x + 1).forEach((xVal) => {
    Array.of(y - 1, y, y + 1).forEach((yVal) => {
      if (!(xVal === x && yVal === y)) {
        const newSquareCoOrds = coOrdKey(xVal, yVal);
        const square = upcomingGame.get(newSquareCoOrds);
        if (!square) {
          return;
        }
        if (type === AdjacentUpdate.mimes) {
          if (!square.mime) {
            (square as { adjacentMimes: number }).adjacentMimes += 1;
            upcomingGame.set(newSquareCoOrds, square);
          }
        }
        if (!square.flagged && !square.opened) {
          if (type === AdjacentUpdate.open && !square.mime) {
            square.opened = true;
            count += 1;
            if (square.adjacentMimes === 0) {
              count += updateAdjacent({
                location: newSquareCoOrds,
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
    });
  });
  return count;
}

/** Checks whether all adjacent mines around a square are flagged. */
export function allAdjacentMimesAreFlagged({
  location,
  upcomingGame,
}: FlaggedAdjacentProps): boolean {
  let flaggedAdjacent = 0;
  let adjacentMimes = 0;
  const [x, y] = getCoOrd(location);
  Array.of(x - 1, x, x + 1).forEach((xVal) => {
    Array.of(y - 1, y, y + 1).forEach((yVal) => {
      if (!(xVal === x && yVal === y)) {
        const coords = coOrdKey(xVal, yVal);
        const square = upcomingGame.get(coords);
        if (square?.mime) {
          adjacentMimes += 1;
          if (square.flagged) {
            flaggedAdjacent += 1;
          }
        }
      }
    });
  });
  return flaggedAdjacent === adjacentMimes;
}

export function populateMimes(
  entries: [Coordinate, GameSquare][],
  numMimes: number,
  boardSize: number,
  currentPieceCoOrds: Coordinate = "-1|-1",
): Map<Coordinate, GameSquare> {
  const mimeLocations: Coordinate[] = [];
  Array.from({ length: numMimes }).forEach(() => {
    let potentialMimeLocation: Coordinate = generateRandomCoOrd(boardSize);
    let failSafe = INITIAL_FAILSAFE;
    while (
      (mimeLocations.includes(potentialMimeLocation) && failSafe > 1) ||
      (potentialMimeLocation === currentPieceCoOrds && failSafe > 1)
    ) {
      potentialMimeLocation = generateRandomCoOrd(boardSize);
      failSafe -= 1;
    }
    mimeLocations.push(potentialMimeLocation);
  });
  const upcomingGame = new Map<Coordinate, GameSquare>(entries);
  mimeLocations
    .map((mimeLocation) => {
      const square: GameSquare | undefined = upcomingGame.get(mimeLocation);
      if (square) {
        square.mime = true;
        upcomingGame.set(mimeLocation, square);
      }
      return mimeLocation;
    })
    .forEach((mimeLocation) => {
      const square = upcomingGame.get(mimeLocation);
      if (square) {
        updateAdjacent({ location: mimeLocation, upcomingGame });
      }
    });
  return upcomingGame;
}

export function newGame(
  size: number,
  squareSide: number,
): Map<Coordinate, GameSquare> {
  const entries: [Coordinate, GameSquare][] = Array.from({
    length: size,
  }).reduce((prevValue: [Coordinate, GameSquare][], _, xIndex) => {
    const currentList: [Coordinate, GameSquare][] = Array.from({
      length: size,
    }).map((__, yIndex) => [
      coOrdKey(xIndex, yIndex),
      {
        mime: false,
        adjacentMimes: 0,
        opened: false,
        flagged: false,
        isGameOver: false,
        x: xIndex * squareSide,
        y: yIndex * squareSide,
      },
    ]);
    return prevValue.concat(currentList);
  }, []);
  return new Map<Coordinate, GameSquare>(entries);
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
