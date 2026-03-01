import { AdjacentUpdate } from "../enums.ts";
import { coOrdKey } from "./coordinates.ts";
import {
  allAdjacentMimesAreFlagged,
  INITIAL_FAILSAFE,
  isWin,
  newGame,
  populateMimes,
  processDoubleClick,
  processRightClick,
  processSquareClick,
  SQUARE_SIDE,
  updateAdjacent,
} from "./gameLogic.ts";
import { createTestBoard, createTestSquare } from "./testHelpers.ts";

/** Retrieves a square from the board, throwing if not found. */
function getSquare(
  board: Map<string, ReturnType<typeof createTestSquare>>,
  coord: string,
): ReturnType<typeof createTestSquare> {
  const square = board.get(coord);
  if (!square) {
    throw new Error(`Square not found at ${coord}`);
  }
  return square;
}

// ─── Constants ───────────────────────────────────────────────────────────────

describe("constants", () => {
  test("INITIAL_FAILSAFE is 100", () => {
    expect(INITIAL_FAILSAFE).toBe(100);
  });

  test("SQUARE_SIDE is 25", () => {
    expect(SQUARE_SIDE).toBe(25);
  });
});

// ─── newGame ─────────────────────────────────────────────────────────────────

describe("newGame", () => {
  test("returns a map with size*size entries", () => {
    const board = newGame(5, 25);
    expect(board.size).toBe(25);
  });

  test("all squares default to unopened, unflagged, non-mime", () => {
    const board = newGame(3, 25);
    for (const square of board.values()) {
      expect(square.mime).toBe(false);
      expect(square.opened).toBe(false);
      expect(square.flagged).toBe(false);
      expect(square.adjacentMimes).toBe(0);
    }
  });

  test("square pixel positions are computed from squareSide", () => {
    const squareSide = 30;
    const board = newGame(3, squareSide);
    const sq00 = board.get(coOrdKey(0, 0));
    const sq12 = board.get(coOrdKey(1, 2));
    const sq22 = board.get(coOrdKey(2, 2));
    expect(sq00?.x).toBe(0);
    expect(sq00?.y).toBe(0);
    expect(sq12?.x).toBe(1 * squareSide);
    expect(sq12?.y).toBe(2 * squareSide);
    expect(sq22?.x).toBe(2 * squareSide);
    expect(sq22?.y).toBe(2 * squareSide);
  });

  test("uses the default SQUARE_SIDE when squareSide is 25", () => {
    const board = newGame(4, SQUARE_SIDE);
    const sq11 = board.get(coOrdKey(1, 1));
    expect(sq11?.x).toBe(25);
    expect(sq11?.y).toBe(25);
  });

  test("correctly creates coordinate keys for all positions", () => {
    const size = 4;
    const board = newGame(size, 25);
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        expect(board.has(coOrdKey(x, y))).toBe(true);
      }
    }
  });

  test("works with size 1", () => {
    const board = newGame(1, 25);
    expect(board.size).toBe(1);
    expect(board.has(coOrdKey(0, 0))).toBe(true);
  });

  test("works with a large size", () => {
    const board = newGame(40, 25);
    expect(board.size).toBe(1600);
  });
});

// ─── updateAdjacent — mimes mode ─────────────────────────────────────────────

describe("updateAdjacent — mimes mode", () => {
  test("increments adjacentMimes for all non-mime neighbors", () => {
    // 3x3 board; mine at center (1,1)
    const board = createTestBoard(3);
    const mineCoord = coOrdKey(1, 1);
    const mineSquare = getSquare(board, mineCoord);
    mineSquare.mime = true;

    updateAdjacent({
      location: mineCoord,
      upcomingGame: board,
      type: AdjacentUpdate.mimes,
    });

    // All 8 surrounding squares should have adjacentMimes=1
    for (let x = 0; x < 3; x++) {
      for (let y = 0; y < 3; y++) {
        if (x === 1 && y === 1) continue;
        expect(board.get(coOrdKey(x, y))?.adjacentMimes).toBe(1);
      }
    }
  });

  test("does NOT increment adjacentMimes on mine neighbors", () => {
    const board = createTestBoard(3);
    // Two adjacent mines: (0,0) and (1,1)
    const mine1 = getSquare(board, coOrdKey(0, 0));
    mine1.mime = true;
    const mine2 = getSquare(board, coOrdKey(1, 1));
    mine2.mime = true;

    // updateAdjacent from mine at (0,0) — mine2 at (1,1) must NOT be incremented
    updateAdjacent({
      location: coOrdKey(0, 0),
      upcomingGame: board,
      type: AdjacentUpdate.mimes,
    });

    expect(board.get(coOrdKey(1, 1))?.adjacentMimes).toBe(0);
  });

  test("handles corner squares — only valid neighbors are updated", () => {
    // 5x5 board; mine at top-left corner (0,0)
    const board = createTestBoard(5);
    const mineCoord = coOrdKey(0, 0);
    getSquare(board, mineCoord).mime = true;

    updateAdjacent({
      location: mineCoord,
      upcomingGame: board,
      type: AdjacentUpdate.mimes,
    });

    // Only (1,0), (0,1), (1,1) are valid and non-mine, so each gets +1
    expect(board.get(coOrdKey(1, 0))?.adjacentMimes).toBe(1);
    expect(board.get(coOrdKey(0, 1))?.adjacentMimes).toBe(1);
    expect(board.get(coOrdKey(1, 1))?.adjacentMimes).toBe(1);
    // Squares further away must stay at 0
    expect(board.get(coOrdKey(2, 0))?.adjacentMimes).toBe(0);
    expect(board.get(coOrdKey(0, 2))?.adjacentMimes).toBe(0);
  });

  test("handles edge squares — only in-bounds neighbors are updated", () => {
    // 5x5 board; mine on the right edge at (4,2)
    const board = createTestBoard(5);
    const mineCoord = coOrdKey(4, 2);
    getSquare(board, mineCoord).mime = true;

    updateAdjacent({
      location: mineCoord,
      upcomingGame: board,
      type: AdjacentUpdate.mimes,
    });

    // Valid neighbors: (3,1), (4,1), (3,2), (3,3), (4,3)
    expect(board.get(coOrdKey(3, 1))?.adjacentMimes).toBe(1);
    expect(board.get(coOrdKey(4, 1))?.adjacentMimes).toBe(1);
    expect(board.get(coOrdKey(3, 2))?.adjacentMimes).toBe(1);
    expect(board.get(coOrdKey(3, 3))?.adjacentMimes).toBe(1);
    expect(board.get(coOrdKey(4, 3))?.adjacentMimes).toBe(1);
    // Out-of-bounds (5,*) does not exist — no crash
    expect(board.get(coOrdKey(5, 2))).toBeUndefined();
  });

  test("returns 0 in mimes mode", () => {
    const board = createTestBoard(3);
    getSquare(board, coOrdKey(1, 1)).mime = true;

    const result = updateAdjacent({
      location: coOrdKey(1, 1),
      upcomingGame: board,
      type: AdjacentUpdate.mimes,
    });

    expect(result).toBe(0);
  });

  test("defaults type to mimes when not provided", () => {
    const board = createTestBoard(3);
    getSquare(board, coOrdKey(1, 1)).mime = true;

    // No `type` argument — should default to AdjacentUpdate.mimes
    updateAdjacent({ location: coOrdKey(1, 1), upcomingGame: board });

    expect(board.get(coOrdKey(0, 0))?.adjacentMimes).toBe(1);
  });
});

// ─── updateAdjacent — open mode ──────────────────────────────────────────────

describe("updateAdjacent — open mode", () => {
  test("opens unflagged, non-mine, unopened neighbors", () => {
    const board = createTestBoard(3);
    // Give center square non-zero adjacentMimes so it won't recurse further
    const center = getSquare(board, coOrdKey(1, 1));
    center.adjacentMimes = 1;
    center.opened = true;

    const openedCount = updateAdjacent({
      location: coOrdKey(1, 1),
      upcomingGame: board,
      type: AdjacentUpdate.open,
    });

    // All 8 neighbors should be opened (none are mines or flagged)
    expect(openedCount).toBe(8);
    for (let x = 0; x < 3; x++) {
      for (let y = 0; y < 3; y++) {
        if (x === 1 && y === 1) continue;
        expect(board.get(coOrdKey(x, y))?.opened).toBe(true);
      }
    }
  });

  test("skips flagged neighbors", () => {
    const board = createTestBoard(3);
    // Give all neighbors non-zero adjacentMimes to prevent cascade
    for (let x = 0; x < 3; x++) {
      for (let y = 0; y < 3; y++) {
        if (x !== 1 || y !== 1) {
          getSquare(board, coOrdKey(x, y)).adjacentMimes = 1;
        }
      }
    }
    getSquare(board, coOrdKey(0, 0)).flagged = true;

    const openedCount = updateAdjacent({
      location: coOrdKey(1, 1),
      upcomingGame: board,
      type: AdjacentUpdate.open,
    });

    expect(board.get(coOrdKey(0, 0))?.opened).toBe(false);
    // The other 7 neighbors are opened (no further cascade since adjacentMimes > 0)
    expect(openedCount).toBe(7);
  });

  test("skips mine neighbors", () => {
    const board = createTestBoard(3);
    getSquare(board, coOrdKey(0, 0)).mime = true;

    updateAdjacent({
      location: coOrdKey(1, 1),
      upcomingGame: board,
      type: AdjacentUpdate.open,
    });

    expect(board.get(coOrdKey(0, 0))?.opened).toBe(false);
  });

  test("skips already-opened neighbors", () => {
    const board = createTestBoard(3);
    // Give all neighbors non-zero adjacentMimes to prevent cascade
    for (let x = 0; x < 3; x++) {
      for (let y = 0; y < 3; y++) {
        if (x !== 1 || y !== 1) {
          getSquare(board, coOrdKey(x, y)).adjacentMimes = 1;
        }
      }
    }
    const alreadyOpen = getSquare(board, coOrdKey(0, 0));
    alreadyOpen.opened = true;

    const openedCount = updateAdjacent({
      location: coOrdKey(1, 1),
      upcomingGame: board,
      type: AdjacentUpdate.open,
    });

    // 7 newly opened (the already-opened one is skipped, no cascade since adjacentMimes > 0)
    expect(openedCount).toBe(7);
  });

  test("recurses when a zero-adjacent neighbor is opened", () => {
    // 5x5 board — all squares default to adjacentMimes=0, so opening any
    // neighbor will cascade recursively across the whole empty region.
    const board = createTestBoard(5);
    // Mark (2,2) as opened to serve as the starting square
    getSquare(board, coOrdKey(2, 2)).opened = true;

    updateAdjacent({
      location: coOrdKey(2, 2),
      upcomingGame: board,
      type: AdjacentUpdate.open,
    });

    // The flood-fill should have opened every square except (2,2) itself
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        expect(board.get(coOrdKey(x, y))?.opened).toBe(true);
      }
    }
  });

  test("stops recursion on squares with non-zero adjacentMimes", () => {
    // 3x3 board where border squares have adjacentMimes=1
    // Only the 8 direct neighbors of center should be opened; no further cascade.
    const board = createTestBoard(3);
    for (let x = 0; x < 3; x++) {
      for (let y = 0; y < 3; y++) {
        if (x !== 1 || y !== 1) {
          getSquare(board, coOrdKey(x, y)).adjacentMimes = 1;
        }
      }
    }

    const openedCount = updateAdjacent({
      location: coOrdKey(1, 1),
      upcomingGame: board,
      type: AdjacentUpdate.open,
    });

    // All 8 neighbors opened once, no further recursion
    expect(openedCount).toBe(8);
  });
});

// ─── updateAdjacent — forceOpen mode ─────────────────────────────────────────

describe("updateAdjacent — forceOpen mode", () => {
  test("opens all unflagged neighbors including mines", () => {
    const board = createTestBoard(3);
    getSquare(board, coOrdKey(0, 0)).mime = true;

    updateAdjacent({
      location: coOrdKey(1, 1),
      upcomingGame: board,
      type: AdjacentUpdate.forceOpen,
    });

    // Mine at (0,0) must be opened
    expect(board.get(coOrdKey(0, 0))?.opened).toBe(true);
    // All non-mine neighbors also opened
    for (let x = 0; x < 3; x++) {
      for (let y = 0; y < 3; y++) {
        if (x === 1 && y === 1) continue;
        expect(board.get(coOrdKey(x, y))?.opened).toBe(true);
      }
    }
  });

  test("skips flagged neighbors", () => {
    const board = createTestBoard(3);
    getSquare(board, coOrdKey(0, 0)).flagged = true;

    const openedCount = updateAdjacent({
      location: coOrdKey(1, 1),
      upcomingGame: board,
      type: AdjacentUpdate.forceOpen,
    });

    expect(board.get(coOrdKey(0, 0))?.opened).toBe(false);
    expect(openedCount).toBe(7);
  });

  test("does NOT recurse even on zero-adjacent squares", () => {
    // 5x5 board — all squares default to adjacentMimes=0.
    // forceOpen from (2,2) must only open the 8 direct neighbors, not cascade.
    const board = createTestBoard(5);
    getSquare(board, coOrdKey(2, 2)).opened = true;

    updateAdjacent({
      location: coOrdKey(2, 2),
      upcomingGame: board,
      type: AdjacentUpdate.forceOpen,
    });

    // Squares two steps away should remain closed
    expect(board.get(coOrdKey(0, 0))?.opened).toBe(false);
    expect(board.get(coOrdKey(4, 4))?.opened).toBe(false);
    expect(board.get(coOrdKey(0, 4))?.opened).toBe(false);
    expect(board.get(coOrdKey(4, 0))?.opened).toBe(false);
  });

  test("returns the count of squares opened", () => {
    const board = createTestBoard(3);

    const openedCount = updateAdjacent({
      location: coOrdKey(1, 1),
      upcomingGame: board,
      type: AdjacentUpdate.forceOpen,
    });

    expect(openedCount).toBe(8);
  });
});

// ─── allAdjacentMimesAreFlagged ───────────────────────────────────────────────

describe("allAdjacentMimesAreFlagged", () => {
  test("returns true when there are no adjacent mines", () => {
    const board = createTestBoard(3);
    // No mines on the board at all

    const result = allAdjacentMimesAreFlagged({
      location: coOrdKey(1, 1),
      upcomingGame: board,
    });

    expect(result).toBe(true);
  });

  test("returns true when all adjacent mines are flagged", () => {
    const board = createTestBoard(3);
    const mineSquare = getSquare(board, coOrdKey(0, 0));
    mineSquare.mime = true;
    mineSquare.flagged = true;

    const result = allAdjacentMimesAreFlagged({
      location: coOrdKey(1, 1),
      upcomingGame: board,
    });

    expect(result).toBe(true);
  });

  test("returns false when an adjacent mine is not flagged", () => {
    const board = createTestBoard(3);
    getSquare(board, coOrdKey(0, 0)).mime = true;
    // mine is NOT flagged

    const result = allAdjacentMimesAreFlagged({
      location: coOrdKey(1, 1),
      upcomingGame: board,
    });

    expect(result).toBe(false);
  });

  test("returns false when only some adjacent mines are flagged", () => {
    const board = createTestBoard(3);
    const mine1 = getSquare(board, coOrdKey(0, 0));
    mine1.mime = true;
    mine1.flagged = true; // flagged

    const mine2 = getSquare(board, coOrdKey(2, 0));
    mine2.mime = true;
    // NOT flagged

    const result = allAdjacentMimesAreFlagged({
      location: coOrdKey(1, 1),
      upcomingGame: board,
    });

    expect(result).toBe(false);
  });

  test("ignores non-mine flagged squares", () => {
    const board = createTestBoard(3);
    // Flag a non-mine — should not affect result
    getSquare(board, coOrdKey(0, 0)).flagged = true;

    const result = allAdjacentMimesAreFlagged({
      location: coOrdKey(1, 1),
      upcomingGame: board,
    });

    // No mines present, so vacuously true
    expect(result).toBe(true);
  });
});

// ─── populateMimes ────────────────────────────────────────────────────────────

describe("populateMimes", () => {
  test("places the correct number of mines", () => {
    const board = createTestBoard(10);
    const entries = Array.from(board.entries());
    const numMimes = 10;

    const result = populateMimes(entries, numMimes, 10);

    const mineCount = Array.from(result.values()).filter((s) => s.mime).length;
    expect(mineCount).toBe(numMimes);
  });

  test("avoids the first-click square", () => {
    // Run many times to make the probabilistic check reliable
    for (let i = 0; i < 20; i++) {
      const board = createTestBoard(10);
      const entries = Array.from(board.entries());
      const firstClick = coOrdKey(5, 5);

      const result = populateMimes(entries, 5, 10, firstClick);

      expect(result.get(firstClick)?.mime).toBe(false);
    }
  });

  test("updates adjacentMimes for non-mine squares next to mines", () => {
    const board = createTestBoard(5);
    const entries = Array.from(board.entries());

    const result = populateMimes(entries, 3, 5);

    // Every mine square should have at least one neighbor with adjacentMimes > 0
    for (const [coord, square] of result.entries()) {
      if (square.mime) {
        // Find at least one non-mine neighbor with an incremented count
        const [mx, my] = coord.split("|").map(Number);
        const hasNeighborWithCount = [-1, 0, 1].some((dx) =>
          [-1, 0, 1].some((dy) => {
            if (dx === 0 && dy === 0) return false;
            const neighbor = result.get(coOrdKey(mx + dx, my + dy));
            return neighbor && !neighbor.mime && neighbor.adjacentMimes > 0;
          }),
        );
        // Only assert if the mine has any non-mine neighbors at all
        const hasAnyNonMineNeighbor = [-1, 0, 1].some((dx) =>
          [-1, 0, 1].some((dy) => {
            if (dx === 0 && dy === 0) return false;
            const neighbor = result.get(coOrdKey(mx + dx, my + dy));
            return neighbor && !neighbor.mime;
          }),
        );
        if (hasAnyNonMineNeighbor) {
          expect(hasNeighborWithCount).toBe(true);
        }
      }
    }
  });

  test("preserves board size", () => {
    const board = createTestBoard(10);
    const entries = Array.from(board.entries());

    const result = populateMimes(entries, 5, 10);

    expect(result.size).toBe(100);
  });

  test("uses entries to construct the returned map", () => {
    const board = createTestBoard(5);
    const entries = Array.from(board.entries());

    const result = populateMimes(entries, 2, 5);

    // Every entry key from the original should exist in result
    for (const [coord] of entries) {
      expect(result.has(coord)).toBe(true);
    }
  });

  test("uses default currentPieceCoOrds of -1|-1 when not provided", () => {
    const board = createTestBoard(5);
    const entries = Array.from(board.entries());

    // "-1|-1" is not a valid board coordinate, so it should not affect mine placement
    expect(() => populateMimes(entries, 3, 5)).not.toThrow();
  });
});

// ─── processRightClick ────────────────────────────────────────────────────────

describe("processRightClick", () => {
  test("flags an unflagged, unopened square and returns -1", () => {
    const square = createTestSquare({ flagged: false, opened: false });

    const result = processRightClick(square);

    expect(result).toBe(-1);
    expect(square.flagged).toBe(true);
  });

  test("unflags a flagged, unopened square and returns +1", () => {
    const square = createTestSquare({ flagged: true, opened: false });

    const result = processRightClick(square);

    expect(result).toBe(1);
    expect(square.flagged).toBe(false);
  });

  test("returns 0 and is a no-op on an already-opened square", () => {
    const square = createTestSquare({ opened: true, flagged: false });

    const result = processRightClick(square);

    expect(result).toBe(0);
    expect(square.flagged).toBe(false);
  });

  test("returns 0 even when opened square was also flagged", () => {
    // Unusual state but the function should still return 0
    const square = createTestSquare({ opened: true, flagged: true });

    const result = processRightClick(square);

    expect(result).toBe(0);
    expect(square.flagged).toBe(true);
  });
});

// ─── processSquareClick ───────────────────────────────────────────────────────

describe("processSquareClick", () => {
  test("opens a normal (non-mine, non-flagged) square and returns openedCount >= 1", () => {
    const board = createTestBoard(3);
    const coord = coOrdKey(1, 1);
    const square = getSquare(board, coord);
    square.adjacentMimes = 1; // non-zero so no cascade

    const result = processSquareClick(coord, board, square);

    expect(result.lost).toBe(false);
    expect(result.openedCount).toBeGreaterThanOrEqual(1);
    expect(square.opened).toBe(true);
  });

  test("returns lost=true when clicking an unflagged mine", () => {
    const board = createTestBoard(3);
    const coord = coOrdKey(1, 1);
    const square = getSquare(board, coord);
    square.mime = true;
    square.flagged = false;

    const result = processSquareClick(coord, board, square);

    expect(result.lost).toBe(true);
    expect(square.opened).toBe(true);
  });

  test("returns no-op (openedCount=0, lost=false) on a flagged square", () => {
    const board = createTestBoard(3);
    const coord = coOrdKey(1, 1);
    const square = getSquare(board, coord);
    square.flagged = true;

    const result = processSquareClick(coord, board, square);

    expect(result).toEqual({ openedCount: 0, lost: false });
    expect(square.opened).toBe(false);
  });

  test("returns no-op on a flagged mine", () => {
    const board = createTestBoard(3);
    const coord = coOrdKey(1, 1);
    const square = getSquare(board, coord);
    square.mime = true;
    square.flagged = true;

    const result = processSquareClick(coord, board, square);

    expect(result).toEqual({ openedCount: 0, lost: false });
    expect(square.opened).toBe(false);
  });

  test("cascades to neighbors when adjacentMimes is 0", () => {
    // 5x5 board with no mines — clicking center cascades to all squares
    const board = createTestBoard(5);
    const coord = coOrdKey(2, 2);
    const square = getSquare(board, coord);
    // adjacentMimes is already 0 (default)

    const result = processSquareClick(coord, board, square);

    expect(result.lost).toBe(false);
    // More than 1 square opened due to cascade
    expect(result.openedCount).toBeGreaterThan(1);
  });

  test("does NOT cascade when adjacentMimes is non-zero", () => {
    const board = createTestBoard(5);
    const coord = coOrdKey(2, 2);
    const square = getSquare(board, coord);
    square.adjacentMimes = 3;

    const result = processSquareClick(coord, board, square);

    // Only the clicked square itself is opened (openedCount=1), no cascade
    expect(result.openedCount).toBe(1);
    expect(result.lost).toBe(false);
  });

  test("returns openedCount=1 when square is already opened and adjacentMimes>0", () => {
    // Already-opened squares should still trigger cascade attempt but won't re-count self
    const board = createTestBoard(3);
    const coord = coOrdKey(1, 1);
    const square = getSquare(board, coord);
    square.opened = true;
    square.adjacentMimes = 1;

    const result = processSquareClick(coord, board, square);

    // openedCount=0 for the self (already opened), still not lost
    expect(result.lost).toBe(false);
    expect(result.openedCount).toBe(0);
  });
});

// ─── processDoubleClick ───────────────────────────────────────────────────────

describe("processDoubleClick", () => {
  test("force-opens adjacent squares when square is opened with adjacentMimes>0 and all mines flagged", () => {
    const board = createTestBoard(3);
    const coord = coOrdKey(1, 1);
    const centerSquare = getSquare(board, coord);
    centerSquare.opened = true;
    centerSquare.adjacentMimes = 1;

    // Place and flag the mine at (0,0)
    const mineSquare = getSquare(board, coOrdKey(0, 0));
    mineSquare.mime = true;
    mineSquare.flagged = true;

    const result = processDoubleClick(coord, board, centerSquare);

    expect(result.lost).toBe(false);
    // The remaining 7 unflagged, unopened neighbors should have been opened
    expect(result.openedCount).toBe(7);
  });

  test("returns lost=true when an unflagged adjacent mine is opened via double-click", () => {
    const board = createTestBoard(3);
    const coord = coOrdKey(1, 1);
    const centerSquare = getSquare(board, coord);
    centerSquare.opened = true;
    centerSquare.adjacentMimes = 1;

    // Unflagged mine next to the center square
    getSquare(board, coOrdKey(0, 0)).mime = true;

    const result = processDoubleClick(coord, board, centerSquare);

    expect(result.lost).toBe(true);
  });

  test("returns no-op when the square is not yet opened", () => {
    const board = createTestBoard(3);
    const coord = coOrdKey(1, 1);
    const square = getSquare(board, coord);
    // square.opened = false (default)
    square.adjacentMimes = 2;

    const result = processDoubleClick(coord, board, square);

    expect(result).toEqual({ openedCount: 0, lost: false });
  });

  test("returns no-op when adjacentMimes is 0", () => {
    const board = createTestBoard(3);
    const coord = coOrdKey(1, 1);
    const square = getSquare(board, coord);
    square.opened = true;
    // adjacentMimes defaults to 0

    const result = processDoubleClick(coord, board, square);

    expect(result).toEqual({ openedCount: 0, lost: false });
  });

  test("returns no-op when both opened=false and adjacentMimes=0", () => {
    const board = createTestBoard(3);
    const coord = coOrdKey(1, 1);
    const square = getSquare(board, coord);

    const result = processDoubleClick(coord, board, square);

    expect(result).toEqual({ openedCount: 0, lost: false });
  });
});

// ─── isWin ────────────────────────────────────────────────────────────────────

describe("isWin", () => {
  test("returns true when numMimes + numOpenSpaces equals boardSize squared", () => {
    // 5x5 board, 5 mines, 20 opened spaces
    expect(isWin(5, 20, 5)).toBe(true);
  });

  test("returns false when sum is less than boardSize squared", () => {
    expect(isWin(5, 15, 5)).toBe(false);
  });

  test("returns false when some open spaces are still missing", () => {
    expect(isWin(10, 89, 10)).toBe(false);
  });

  test("returns true for a minimal 1x1 board with one mine", () => {
    expect(isWin(1, 0, 1)).toBe(true);
  });

  test("returns true for a minimal 1x1 board with zero mines and one open space", () => {
    expect(isWin(0, 1, 1)).toBe(true);
  });

  test("returns false when sum exceeds boardSize squared (guard case)", () => {
    // Should not happen in practice but the function uses strict equality
    expect(isWin(5, 21, 5)).toBe(false);
  });

  test("works correctly for larger grids", () => {
    // 10x10 board, 10 mines, 90 opened = win
    expect(isWin(10, 90, 10)).toBe(true);
    // 10x10 board, 10 mines, 89 opened = not yet won
    expect(isWin(10, 89, 10)).toBe(false);
  });
});
