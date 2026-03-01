import type { Coordinate } from "types.d";
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
  });

  describe("START_GAME", () => {
    test("sets boardSize and numMimes from action", () => {
      const result = gameReducer(initialState, {
        type: "START_GAME",
        boardSize: GridSize.L,
        numMimes: MimeSize.L,
      });

      expect(result.boardSize).toBe(GridSize.L);
      expect(result.numMimes).toBe(MimeSize.L);
    });

    test("sets numFlags to match numMimes", () => {
      const result = gameReducer(initialState, {
        type: "START_GAME",
        boardSize: GridSize.M,
        numMimes: MimeSize.M,
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
      });

      expect(result.status).toBe("waitingStart");
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

  describe("default case", () => {
    test("returns state unchanged for unknown action type", () => {
      const result = gameReducer(initialState, {
        type: "UNKNOWN",
      } as unknown as GameAction);

      expect(result).toBe(initialState);
    });
  });
});
