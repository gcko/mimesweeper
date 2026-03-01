import type { Coordinate, GameSquare, GameStatus } from "types.d";
import { GridSize, MimeSize } from "./enums.ts";
import {
  isWin,
  newGame,
  populateMimes,
  processDoubleClick,
  processRightClick,
  processSquareClick,
  SQUARE_SIDE,
} from "./utils/gameLogic.ts";

export interface GameState {
  game: Map<Coordinate, GameSquare> | null;
  boardSize: GridSize;
  status: GameStatus;
  numMimes: MimeSize;
  numFlags: number;
  numOpenSpaces: number;
  playTime: number;
  showRules: boolean;
}

export type GameAction =
  | { type: "START_GAME"; boardSize: GridSize; numMimes: MimeSize }
  | { type: "INIT_BOARD" }
  | { type: "SQUARE_CLICK"; coordinate: Coordinate }
  | { type: "SQUARE_DOUBLE_CLICK"; coordinate: Coordinate }
  | { type: "SQUARE_RIGHT_CLICK"; coordinate: Coordinate }
  | { type: "TICK" }
  | { type: "TOGGLE_RULES" };

export const initialState: GameState = {
  game: null,
  boardSize: GridSize.S,
  status: "waitingStart",
  numMimes: MimeSize.S,
  numFlags: MimeSize.S,
  numOpenSpaces: 0,
  playTime: 0,
  showRules: false,
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_GAME":
      return {
        ...state,
        status: "waitingStart",
        boardSize: action.boardSize,
        numMimes: action.numMimes,
        numFlags: action.numMimes,
        numOpenSpaces: 0,
        playTime: 0,
      };

    case "INIT_BOARD": {
      if (state.status !== "waitingStart") {
        return state;
      }
      return {
        ...state,
        game: newGame(state.boardSize, SQUARE_SIDE),
      };
    }

    case "TICK":
      return { ...state, playTime: state.playTime + 1 };

    case "TOGGLE_RULES":
      return { ...state, showRules: !state.showRules };

    case "SQUARE_CLICK": {
      if (!state.game) return state;

      let nextGame = state.game;
      let nextStatus: GameStatus = state.status;

      // First click: populate mines and start game
      if (state.status === "waitingStart") {
        nextGame = populateMimes(
          Array.from(state.game.entries()),
          state.numMimes,
          state.boardSize,
          action.coordinate,
        );
        nextStatus = "inProgress";
      }

      const square = nextGame.get(action.coordinate);
      if (!square) return state;

      const result = processSquareClick(action.coordinate, nextGame, square);

      if (result.lost) {
        nextStatus = "gameOverLost";
      }

      const newOpenSpaces = state.numOpenSpaces + result.openedCount;
      if (
        !result.lost &&
        isWin(state.numMimes, newOpenSpaces, state.boardSize)
      ) {
        nextStatus = "gameOverWon";
      }

      nextGame.set(action.coordinate, square);

      return {
        ...state,
        game: new Map(nextGame),
        status: nextStatus,
        numOpenSpaces: newOpenSpaces,
      };
    }

    case "SQUARE_RIGHT_CLICK": {
      if (!state.game) return state;

      const nextGame = new Map(state.game);
      const square = nextGame.get(action.coordinate);
      if (!square) return state;

      const flagDelta = processRightClick(square);
      nextGame.set(action.coordinate, square);

      return {
        ...state,
        game: nextGame,
        numFlags: state.numFlags + flagDelta,
      };
    }

    case "SQUARE_DOUBLE_CLICK": {
      if (!state.game) return state;

      const nextGame = new Map(state.game);
      const square = nextGame.get(action.coordinate);
      if (!square) return state;

      const result = processDoubleClick(action.coordinate, nextGame, square);

      let nextStatus = state.status;
      if (result.lost) {
        nextStatus = "gameOverLost";
      }

      const newOpenSpaces = state.numOpenSpaces + result.openedCount;
      if (
        !result.lost &&
        isWin(state.numMimes, newOpenSpaces, state.boardSize)
      ) {
        nextStatus = "gameOverWon";
      }

      nextGame.set(action.coordinate, square);

      return {
        ...state,
        game: nextGame,
        status: nextStatus,
        numOpenSpaces: newOpenSpaces,
      };
    }

    default:
      return state;
  }
}
