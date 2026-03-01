import type { Coordinate, GameSquare } from "types.d";
import { GridSize, MimeSize } from "./enums.ts";
import {
  type GameAction,
  type GameState,
  gameReducer,
  initialState,
} from "./gameReducer.ts";
import * as gameLogic from "./utils/gameLogic.ts";
import { createTestBoard } from "./utils/testHelpers.ts";

describe("gameReducer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initialState", () => {
    test("has correct default values", () => {
      expect(initialState.game).toBeNull();
      expect(initialState.boardSize).toBe(GridSize.S);
      expect(initialState.status).toBe("waitingStart");
      expect(initialState.numMimes).toBe(MimeSize.S);
      expect(initialState.numFlags).toBe(MimeSize.S);
      expect(initialState.numOpenSpaces).toBe(0);
      expect(initialState.playTime).toBe(0);
      expect(initialState.showRules).toBe(false);
    });

    test("has score initialized to 0", () => {
      expect(initialState.score).toBe(0);
    });
  });

  describe("START_GAME", () => {
    test("sets boardSize and numMimes from action", () => {
      const result = gameReducer(initialState, {
        type: "START_GAME",
        boardSize: GridSize.L,
        numMimes: MimeSize.L,
        squareSide: 25,
      });

      expect(result.boardSize).toBe(GridSize.L);
      expect(result.numMimes).toBe(MimeSize.L);
    });

    test("sets numFlags to match numMimes", () => {
      const result = gameReducer(initialState, {
        type: "START_GAME",
        boardSize: GridSize.M,
        numMimes: MimeSize.M,
        squareSide: 25,
      });

      expect(result.numFlags).toBe(MimeSize.M);
    });

    test("resets playTime to 0", () => {
      const state: GameState = {
        ...initialState,
        playTime: 42,
      };

      const result = gameReducer(state, {
        type: "START_GAME",
        boardSize: GridSize.S,
        numMimes: MimeSize.S,
        squareSide: 25,
      });

      expect(result.playTime).toBe(0);
    });

    test("resets numOpenSpaces to 0", () => {
      const state: GameState = {
        ...initialState,
        numOpenSpaces: 50,
      };

      const result = gameReducer(state, {
        type: "START_GAME",
        boardSize: GridSize.S,
        numMimes: MimeSize.S,
        squareSide: 25,
      });

      expect(result.numOpenSpaces).toBe(0);
    });

    test("sets status to waitingStart", () => {
      const state: GameState = {
        ...initialState,
        status: "gameOverLost",
      };

      const result = gameReducer(state, {
        type: "START_GAME",
        boardSize: GridSize.S,
        numMimes: MimeSize.S,
        squareSide: 25,
      });

      expect(result.status).toBe("waitingStart");
    });

    test("sets score to 1000 for GridSize.S", () => {
      const result = gameReducer(initialState, {
        type: "START_GAME",
        boardSize: GridSize.S,
        numMimes: MimeSize.S,
        squareSide: 25,
      });

      expect(result.score).toBe(1000);
    });

    test("sets score to 6000 for GridSize.M", () => {
      const result = gameReducer(initialState, {
        type: "START_GAME",
        boardSize: GridSize.M,
        numMimes: MimeSize.M,
        squareSide: 25,
      });

      expect(result.score).toBe(6000);
    });

    test("sets score to 11000 for GridSize.L", () => {
      const result = gameReducer(initialState, {
        type: "START_GAME",
        boardSize: GridSize.L,
        numMimes: MimeSize.L,
        squareSide: 25,
      });

      expect(result.score).toBe(11000);
    });

    test("sets score to 16000 for GridSize.XL", () => {
      const result = gameReducer(initialState, {
        type: "START_GAME",
        boardSize: GridSize.XL,
        numMimes: MimeSize.XL,
        squareSide: 25,
      });

      expect(result.score).toBe(16000);
    });
  });

  describe("INIT_BOARD", () => {
    test("creates game when status is waitingStart", () => {
      const newGameSpy = vi.spyOn(gameLogic, "newGame");

      const result = gameReducer(initialState, { type: "INIT_BOARD" });

      expect(newGameSpy).toHaveBeenCalledWith(
        GridSize.S,
        gameLogic.SQUARE_SIDE,
      );
      expect(result.game).toBeInstanceOf(Map);
    });

    test("is no-op when status is inProgress", () => {
      const state: GameState = {
        ...initialState,
        status: "inProgress",
        game: createTestBoard(2),
      };

      const result = gameReducer(state, { type: "INIT_BOARD" });

      expect(result).toBe(state);
    });

    test("is no-op when status is gameOverWon", () => {
      const state: GameState = {
        ...initialState,
        status: "gameOverWon",
      };

      const result = gameReducer(state, { type: "INIT_BOARD" });

      expect(result).toBe(state);
    });

    test("is no-op when status is gameOverLost", () => {
      const state: GameState = {
        ...initialState,
        status: "gameOverLost",
      };

      const result = gameReducer(state, { type: "INIT_BOARD" });

      expect(result).toBe(state);
    });

    test("INIT_BOARD uses squareSide from state", () => {
      const startState = gameReducer(initialState, {
        type: "START_GAME",
        boardSize: GridSize.S,
        numMimes: MimeSize.S,
        squareSide: 35,
      });
      const result = gameReducer(startState, { type: "INIT_BOARD" });
      const square = result.game?.get("1|0" as Coordinate);
      expect(square?.x).toBe(35); // 1 * 35
    });
  });

  describe("TICK", () => {
    test("increments playTime by 1", () => {
      const result = gameReducer(initialState, { type: "TICK" });

      expect(result.playTime).toBe(1);
    });

    test("increments from current playTime", () => {
      const state: GameState = { ...initialState, playTime: 99 };

      const result = gameReducer(state, { type: "TICK" });

      expect(result.playTime).toBe(100);
    });

    test("decrements score by 5", () => {
      const state: GameState = { ...initialState, score: 1000 };

      const result = gameReducer(state, { type: "TICK" });

      expect(result.score).toBe(995);
    });

    test("score does not go below 0", () => {
      const state: GameState = { ...initialState, score: 2 };

      const result = gameReducer(state, { type: "TICK" });

      expect(result.score).toBe(0);
    });
  });

  describe("TOGGLE_RULES", () => {
    test("toggles showRules from false to true", () => {
      const result = gameReducer(initialState, { type: "TOGGLE_RULES" });

      expect(result.showRules).toBe(true);
    });

    test("toggles showRules from true to false", () => {
      const state: GameState = { ...initialState, showRules: true };

      const result = gameReducer(state, { type: "TOGGLE_RULES" });

      expect(result.showRules).toBe(false);
    });
  });

  describe("SQUARE_CLICK", () => {
    test("returns state unchanged if no game", () => {
      const result = gameReducer(initialState, {
        type: "SQUARE_CLICK",
        coordinate: "0|0" as Coordinate,
      });

      expect(result).toBe(initialState);
    });

    test("populates mines on first click and transitions to inProgress", () => {
      const board = createTestBoard(3);
      const state: GameState = {
        ...initialState,
        game: board,
        boardSize: GridSize.XS,
        numMimes: MimeSize.XS,
      };

      const populateSpy = vi
        .spyOn(gameLogic, "populateMimes")
        .mockReturnValue(new Map(board));
      const clickSpy = vi
        .spyOn(gameLogic, "processSquareClick")
        .mockReturnValue({ openedCount: 1, lost: false });

      const result = gameReducer(state, {
        type: "SQUARE_CLICK",
        coordinate: "0|0" as Coordinate,
      });

      expect(populateSpy).toHaveBeenCalledWith(
        Array.from(board.entries()),
        MimeSize.XS,
        GridSize.XS,
        "0|0",
      );
      expect(clickSpy).toHaveBeenCalled();
      expect(result.status).toBe("inProgress");
    });

    test("triggers gameOverLost on mine click", () => {
      const board = createTestBoard(3);
      const state: GameState = {
        ...initialState,
        game: board,
        boardSize: GridSize.XS,
        numMimes: MimeSize.XS,
      };

      vi.spyOn(gameLogic, "populateMimes").mockReturnValue(new Map(board));
      vi.spyOn(gameLogic, "processSquareClick").mockReturnValue({
        openedCount: 0,
        lost: true,
      });

      const result = gameReducer(state, {
        type: "SQUARE_CLICK",
        coordinate: "0|0" as Coordinate,
      });

      expect(result.status).toBe("gameOverLost");
    });

    test("updates numOpenSpaces on safe click", () => {
      const board = createTestBoard(3);
      const state: GameState = {
        ...initialState,
        game: board,
        status: "inProgress",
        numOpenSpaces: 2,
      };

      vi.spyOn(gameLogic, "processSquareClick").mockReturnValue({
        openedCount: 3,
        lost: false,
      });

      const result = gameReducer(state, {
        type: "SQUARE_CLICK",
        coordinate: "0|0" as Coordinate,
      });

      expect(result.numOpenSpaces).toBe(5);
    });

    test("triggers gameOverWon when all non-mine squares opened", () => {
      const board = createTestBoard(3);
      const state: GameState = {
        ...initialState,
        game: board,
        boardSize: GridSize.XS,
        numMimes: MimeSize.XS,
        status: "inProgress",
        numOpenSpaces: 19,
      };

      vi.spyOn(gameLogic, "processSquareClick").mockReturnValue({
        openedCount: 1,
        lost: false,
      });
      vi.spyOn(gameLogic, "isWin").mockReturnValue(true);

      const result = gameReducer(state, {
        type: "SQUARE_CLICK",
        coordinate: "0|0" as Coordinate,
      });

      expect(result.status).toBe("gameOverWon");
    });

    test("does not check win if lost", () => {
      const board = createTestBoard(3);
      const state: GameState = {
        ...initialState,
        game: board,
        boardSize: GridSize.XS,
        numMimes: MimeSize.XS,
      };

      vi.spyOn(gameLogic, "populateMimes").mockReturnValue(new Map(board));
      vi.spyOn(gameLogic, "processSquareClick").mockReturnValue({
        openedCount: 0,
        lost: true,
      });
      const isWinSpy = vi.spyOn(gameLogic, "isWin");

      gameReducer(state, {
        type: "SQUARE_CLICK",
        coordinate: "0|0" as Coordinate,
      });

      expect(isWinSpy).not.toHaveBeenCalled();
    });

    test("returns state unchanged when gameOverLost", () => {
      const board = createTestBoard(3);
      const state: GameState = {
        ...initialState,
        game: board,
        status: "gameOverLost",
      };

      const result = gameReducer(state, {
        type: "SQUARE_CLICK",
        coordinate: "0|0" as Coordinate,
      });

      expect(result).toBe(state);
    });

    test("returns state unchanged when gameOverWon", () => {
      const board = createTestBoard(3);
      const state: GameState = {
        ...initialState,
        game: board,
        status: "gameOverWon",
      };

      const result = gameReducer(state, {
        type: "SQUARE_CLICK",
        coordinate: "0|0" as Coordinate,
      });

      expect(result).toBe(state);
    });

    test("returns state unchanged if square not found", () => {
      const board = createTestBoard(3);
      const state: GameState = {
        ...initialState,
        game: board,
        status: "inProgress",
      };

      const result = gameReducer(state, {
        type: "SQUARE_CLICK",
        coordinate: "99|99" as Coordinate,
      });

      expect(result).toBe(state);
    });

    test("returns a new Map reference for the game", () => {
      const board = createTestBoard(3);
      const state: GameState = {
        ...initialState,
        game: board,
        status: "inProgress",
      };

      vi.spyOn(gameLogic, "processSquareClick").mockReturnValue({
        openedCount: 1,
        lost: false,
      });

      const result = gameReducer(state, {
        type: "SQUARE_CLICK",
        coordinate: "0|0" as Coordinate,
      });

      expect(result.game).not.toBe(state.game);
      expect(result.game).toBeInstanceOf(Map);
    });

    describe("mine reveal on game over", () => {
      test("reveals all unflagged mines when game is lost", () => {
        const board = createTestBoard(3);
        const mine1 = board.get("1|0" as Coordinate);
        expect(mine1).toBeDefined();
        if (mine1) mine1.mime = true;
        const mine2 = board.get("2|0" as Coordinate);
        expect(mine2).toBeDefined();
        if (mine2) mine2.mime = true;

        const state: GameState = {
          ...initialState,
          game: board,
          status: "inProgress",
          numMimes: MimeSize.XS,
        };

        vi.spyOn(gameLogic, "processSquareClick").mockReturnValue({
          openedCount: 0,
          lost: true,
        });

        const result = gameReducer(state, {
          type: "SQUARE_CLICK",
          coordinate: "1|0" as Coordinate,
        });

        const otherMine = result.game?.get("2|0" as Coordinate);
        expect(otherMine?.opened).toBe(true);
      });

      test("marks clicked mine with clickedMime flag", () => {
        const board = createTestBoard(3);
        const mine = board.get("1|0" as Coordinate);
        expect(mine).toBeDefined();
        if (mine) mine.mime = true;

        const state: GameState = {
          ...initialState,
          game: board,
          status: "inProgress",
          numMimes: MimeSize.XS,
        };

        vi.spyOn(gameLogic, "processSquareClick").mockReturnValue({
          openedCount: 0,
          lost: true,
        });

        const result = gameReducer(state, {
          type: "SQUARE_CLICK",
          coordinate: "1|0" as Coordinate,
        });

        const clickedMine = result.game?.get("1|0" as Coordinate);
        expect(clickedMine?.clickedMime).toBe(true);
      });

      test("marks wrongly flagged non-mine squares", () => {
        const board = createTestBoard(3);
        const mine = board.get("1|0" as Coordinate);
        expect(mine).toBeDefined();
        if (mine) mine.mime = true;
        const wrongSquare = board.get("0|1" as Coordinate);
        expect(wrongSquare).toBeDefined();
        if (wrongSquare) wrongSquare.flagged = true;

        const state: GameState = {
          ...initialState,
          game: board,
          status: "inProgress",
          numMimes: MimeSize.XS,
        };

        vi.spyOn(gameLogic, "processSquareClick").mockReturnValue({
          openedCount: 0,
          lost: true,
        });

        const result = gameReducer(state, {
          type: "SQUARE_CLICK",
          coordinate: "1|0" as Coordinate,
        });

        const wrong = result.game?.get("0|1" as Coordinate);
        expect(wrong?.wrongFlag).toBe(true);
      });

      test("does not mark correctly flagged mines as wrongFlag", () => {
        const board = createTestBoard(3);
        const mine1 = board.get("1|0" as Coordinate);
        expect(mine1).toBeDefined();
        if (mine1) mine1.mime = true;
        const mine2 = board.get("2|0" as Coordinate);
        expect(mine2).toBeDefined();
        if (mine2) {
          mine2.mime = true;
          mine2.flagged = true;
        }

        const state: GameState = {
          ...initialState,
          game: board,
          status: "inProgress",
          numMimes: MimeSize.XS,
        };

        vi.spyOn(gameLogic, "processSquareClick").mockReturnValue({
          openedCount: 0,
          lost: true,
        });

        const result = gameReducer(state, {
          type: "SQUARE_CLICK",
          coordinate: "1|0" as Coordinate,
        });

        const correctFlag = result.game?.get("2|0" as Coordinate);
        expect(correctFlag?.wrongFlag).toBeUndefined();
      });
    });

    test("does not mutate original state.game during inProgress click", () => {
      const board = createTestBoard(3);
      const originalSquare = board.get("0|0" as Coordinate);
      const originalOpened = originalSquare?.opened;

      const state: GameState = {
        ...initialState,
        game: board,
        status: "inProgress",
      };

      // Use real processSquareClick (no mock) so it mutates
      gameReducer(state, {
        type: "SQUARE_CLICK",
        coordinate: "0|0" as Coordinate,
      });

      // Original board's square should not have been mutated
      const squareAfter = board.get("0|0" as Coordinate);
      expect(squareAfter?.opened).toBe(originalOpened);
    });
  });

  describe("SQUARE_RIGHT_CLICK", () => {
    test("returns state unchanged if no game", () => {
      const result = gameReducer(initialState, {
        type: "SQUARE_RIGHT_CLICK",
        coordinate: "0|0" as Coordinate,
      });

      expect(result).toBe(initialState);
    });

    test("decrements numFlags when flagging", () => {
      const board = createTestBoard(3);
      const state: GameState = {
        ...initialState,
        game: board,
        status: "inProgress",
        numFlags: 10,
      };

      vi.spyOn(gameLogic, "processRightClick").mockReturnValue(-1);

      const result = gameReducer(state, {
        type: "SQUARE_RIGHT_CLICK",
        coordinate: "0|0" as Coordinate,
      });

      expect(result.numFlags).toBe(9);
    });

    test("increments numFlags when unflagging", () => {
      const board = createTestBoard(3);
      const state: GameState = {
        ...initialState,
        game: board,
        status: "inProgress",
        numFlags: 9,
      };

      vi.spyOn(gameLogic, "processRightClick").mockReturnValue(1);

      const result = gameReducer(state, {
        type: "SQUARE_RIGHT_CLICK",
        coordinate: "0|0" as Coordinate,
      });

      expect(result.numFlags).toBe(10);
    });

    test("does not change numFlags on no-op (delta 0)", () => {
      const board = createTestBoard(3);
      const state: GameState = {
        ...initialState,
        game: board,
        status: "inProgress",
        numFlags: 10,
      };

      vi.spyOn(gameLogic, "processRightClick").mockReturnValue(0);

      const result = gameReducer(state, {
        type: "SQUARE_RIGHT_CLICK",
        coordinate: "0|0" as Coordinate,
      });

      expect(result.numFlags).toBe(10);
    });

    test("returns state unchanged when gameOverLost", () => {
      const board = createTestBoard(3);
      const state: GameState = {
        ...initialState,
        game: board,
        status: "gameOverLost",
      };

      const result = gameReducer(state, {
        type: "SQUARE_RIGHT_CLICK",
        coordinate: "0|0" as Coordinate,
      });

      expect(result).toBe(state);
    });

    test("returns state unchanged when gameOverWon", () => {
      const board = createTestBoard(3);
      const state: GameState = {
        ...initialState,
        game: board,
        status: "gameOverWon",
      };

      const result = gameReducer(state, {
        type: "SQUARE_RIGHT_CLICK",
        coordinate: "0|0" as Coordinate,
      });

      expect(result).toBe(state);
    });

    test("returns state unchanged if square not found", () => {
      const board = createTestBoard(3);
      const state: GameState = {
        ...initialState,
        game: board,
        status: "inProgress",
      };

      const result = gameReducer(state, {
        type: "SQUARE_RIGHT_CLICK",
        coordinate: "99|99" as Coordinate,
      });

      expect(result).toBe(state);
    });

    test("returns a new Map reference for the game", () => {
      const board = createTestBoard(3);
      const state: GameState = {
        ...initialState,
        game: board,
        status: "inProgress",
      };

      vi.spyOn(gameLogic, "processRightClick").mockReturnValue(-1);

      const result = gameReducer(state, {
        type: "SQUARE_RIGHT_CLICK",
        coordinate: "0|0" as Coordinate,
      });

      expect(result.game).not.toBe(state.game);
      expect(result.game).toBeInstanceOf(Map);
    });
  });

  describe("SQUARE_DOUBLE_CLICK", () => {
    test("returns state unchanged if no game", () => {
      const result = gameReducer(initialState, {
        type: "SQUARE_DOUBLE_CLICK",
        coordinate: "0|0" as Coordinate,
      });

      expect(result).toBe(initialState);
    });

    test("triggers gameOverLost on unsafe double click", () => {
      const board = createTestBoard(3);
      const state: GameState = {
        ...initialState,
        game: board,
        status: "inProgress",
      };

      vi.spyOn(gameLogic, "processDoubleClick").mockReturnValue({
        openedCount: 2,
        lost: true,
      });

      const result = gameReducer(state, {
        type: "SQUARE_DOUBLE_CLICK",
        coordinate: "0|0" as Coordinate,
      });

      expect(result.status).toBe("gameOverLost");
    });

    test("updates numOpenSpaces on safe double click", () => {
      const board = createTestBoard(3);
      const state: GameState = {
        ...initialState,
        game: board,
        status: "inProgress",
        numOpenSpaces: 3,
      };

      vi.spyOn(gameLogic, "processDoubleClick").mockReturnValue({
        openedCount: 4,
        lost: false,
      });

      const result = gameReducer(state, {
        type: "SQUARE_DOUBLE_CLICK",
        coordinate: "0|0" as Coordinate,
      });

      expect(result.numOpenSpaces).toBe(7);
    });

    test("triggers gameOverWon when all non-mine squares opened", () => {
      const board = createTestBoard(3);
      const state: GameState = {
        ...initialState,
        game: board,
        boardSize: GridSize.XS,
        numMimes: MimeSize.XS,
        status: "inProgress",
        numOpenSpaces: 18,
      };

      vi.spyOn(gameLogic, "processDoubleClick").mockReturnValue({
        openedCount: 2,
        lost: false,
      });
      vi.spyOn(gameLogic, "isWin").mockReturnValue(true);

      const result = gameReducer(state, {
        type: "SQUARE_DOUBLE_CLICK",
        coordinate: "0|0" as Coordinate,
      });

      expect(result.status).toBe("gameOverWon");
    });

    test("returns state unchanged when gameOverLost", () => {
      const board = createTestBoard(3);
      const state: GameState = {
        ...initialState,
        game: board,
        status: "gameOverLost",
      };

      const result = gameReducer(state, {
        type: "SQUARE_DOUBLE_CLICK",
        coordinate: "0|0" as Coordinate,
      });

      expect(result).toBe(state);
    });

    test("returns state unchanged when gameOverWon", () => {
      const board = createTestBoard(3);
      const state: GameState = {
        ...initialState,
        game: board,
        status: "gameOverWon",
      };

      const result = gameReducer(state, {
        type: "SQUARE_DOUBLE_CLICK",
        coordinate: "0|0" as Coordinate,
      });

      expect(result).toBe(state);
    });

    test("returns state unchanged if square not found", () => {
      const board = createTestBoard(3);
      const state: GameState = {
        ...initialState,
        game: board,
        status: "inProgress",
      };

      const result = gameReducer(state, {
        type: "SQUARE_DOUBLE_CLICK",
        coordinate: "99|99" as Coordinate,
      });

      expect(result).toBe(state);
    });

    test("returns a new Map reference for the game", () => {
      const board = createTestBoard(3);
      const state: GameState = {
        ...initialState,
        game: board,
        status: "inProgress",
      };

      vi.spyOn(gameLogic, "processDoubleClick").mockReturnValue({
        openedCount: 1,
        lost: false,
      });

      const result = gameReducer(state, {
        type: "SQUARE_DOUBLE_CLICK",
        coordinate: "0|0" as Coordinate,
      });

      expect(result.game).not.toBe(state.game);
      expect(result.game).toBeInstanceOf(Map);
    });
  });

  /**
   * Mimesweeper is a recreation of classic Minesweeper. The ONLY
   * difference is the visual use of "mimes" as a gag. All game
   * logic must follow standard Minesweeper rules exactly.
   */
  describe("Minesweeper rules", () => {
    test("first click never lands on a mine (safe start)", () => {
      const board = createTestBoard(5);
      const state: GameState = {
        ...initialState,
        game: board,
        boardSize: GridSize.XS,
        numMimes: MimeSize.XS,
      };

      const result = gameReducer(state, {
        type: "SQUARE_CLICK",
        coordinate: "2|2" as Coordinate,
      });

      const clickedSquare = result.game?.get("2|2" as Coordinate);
      expect(clickedSquare?.mime).toBe(false);
      expect(clickedSquare?.opened).toBe(true);
      expect(result.status).not.toBe("gameOverLost");
    });

    test("flood fill from a zero square never opens mine squares", () => {
      const board = createTestBoard(5);
      const state: GameState = {
        ...initialState,
        game: board,
        boardSize: GridSize.XS,
        numMimes: MimeSize.XS,
      };

      const result = gameReducer(state, {
        type: "SQUARE_CLICK",
        coordinate: "2|2" as Coordinate,
      });

      // No mine square should ever be opened during flood fill.
      // In Minesweeper, mines are only revealed on game over.
      expect(result.game).not.toBeNull();
      for (const [, square] of result.game as Map<Coordinate, GameSquare>) {
        if (square.mime) {
          expect(square.opened).toBe(false);
        }
      }
    });

    test("first click does not mutate original state (StrictMode safe)", () => {
      const board = createTestBoard(5);
      const state: GameState = {
        ...initialState,
        game: board,
        boardSize: GridSize.XS,
        numMimes: MimeSize.XS,
      };

      // Snapshot original state values
      const originalSquares = new Map<Coordinate, GameSquare>();
      for (const [k, v] of board) {
        originalSquares.set(k, { ...v });
      }

      gameReducer(state, {
        type: "SQUARE_CLICK",
        coordinate: "2|2" as Coordinate,
      });

      // Verify state.game was not mutated
      for (const [k, original] of originalSquares) {
        const current = board.get(k);
        expect(current?.mime).toBe(original.mime);
        expect(current?.opened).toBe(original.opened);
        expect(current?.adjacentMimes).toBe(original.adjacentMimes);
        expect(current?.flagged).toBe(original.flagged);
      }
    });

    test("double-invoking first click produces consistent results (StrictMode)", () => {
      const board = createTestBoard(5);
      const state: GameState = {
        ...initialState,
        game: board,
        boardSize: GridSize.XS,
        numMimes: MimeSize.XS,
      };

      // Simulate StrictMode: call reducer twice with same state + action
      const action: GameAction = {
        type: "SQUARE_CLICK",
        coordinate: "2|2" as Coordinate,
      };

      const result1 = gameReducer(state, action);
      const result2 = gameReducer(state, action);

      expect(result1.game).not.toBeNull();
      expect(result2.game).not.toBeNull();
      const game1 = result1.game as Map<Coordinate, GameSquare>;
      const game2 = result2.game as Map<Coordinate, GameSquare>;

      // Both results should have the same number of mines
      let mineCount1 = 0;
      let mineCount2 = 0;
      for (const [, sq] of game1) {
        if (sq.mime) mineCount1++;
      }
      for (const [, sq] of game2) {
        if (sq.mime) mineCount2++;
      }
      expect(mineCount1).toBe(MimeSize.XS);
      expect(mineCount2).toBe(MimeSize.XS);

      // Neither result should have opened mines
      for (const [, sq] of game1) {
        if (sq.mime) expect(sq.opened).toBe(false);
      }
      for (const [, sq] of game2) {
        if (sq.mime) expect(sq.opened).toBe(false);
      }
    });

    test("only clicking a mine triggers game over (not flood fill)", () => {
      const board = createTestBoard(3);
      // Manually set up a board with a known mine
      const mineCoord = "1|1" as Coordinate;
      const mineSquare = board.get(mineCoord);
      expect(mineSquare).toBeDefined();
      if (mineSquare) {
        mineSquare.mime = true;
      }

      // Set adjacentMimes on neighbors
      for (const [k, sq] of board) {
        if (k !== mineCoord) {
          sq.adjacentMimes = 1 as GameSquare["adjacentMimes"];
        }
      }

      const state: GameState = {
        ...initialState,
        game: board,
        status: "inProgress",
      };

      // Click a non-mine square — should not trigger game over
      const result = gameReducer(state, {
        type: "SQUARE_CLICK",
        coordinate: "0|0" as Coordinate,
      });

      expect(result.status).toBe("inProgress");
      // Mine should remain unopened
      const mine = result.game?.get(mineCoord);
      expect(mine?.opened).toBe(false);
    });
  });

  describe("default case", () => {
    test("returns state unchanged for unknown action type", () => {
      const result = gameReducer(initialState, {
        type: "UNKNOWN",
      } as unknown as GameAction);

      expect(result).toBe(initialState);
    });
  });
});
