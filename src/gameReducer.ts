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
import { decrementScore, getBaseScore } from "./utils/score.ts";

export interface GameState {
  game: Map<Coordinate, GameSquare> | null;
  boardSize: GridSize;
  status: GameStatus;
  numMimes: MimeSize;
  numFlags: number;
  numOpenSpaces: number;
  playTime: number;
  score: number;
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
  score: 0,
  showRules: false,
};

function cloneGame(
  game: Map<Coordinate, GameSquare>,
): Map<Coordinate, GameSquare> {
  const clone = new Map<Coordinate, GameSquare>();
  for (const [k, v] of game) {
    clone.set(k, { ...v });
  }
  return clone;
}

function revealMinesOnLoss(
  game: Map<Coordinate, GameSquare>,
  clickedCoord: Coordinate,
): void {
  for (const [coord, square] of game) {
    if (coord === clickedCoord) {
      square.clickedMime = true;
    } else if (square.mime && !square.flagged) {
      square.opened = true;
    } else if (!square.mime && square.flagged) {
      square.wrongFlag = true;
    }
  }
}

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
        score: getBaseScore(action.boardSize),
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
      return {
        ...state,
        playTime: state.playTime + 1,
        score: decrementScore(state.score),
      };

    case "TOGGLE_RULES":
      return { ...state, showRules: !state.showRules };

    case "SQUARE_CLICK": {
      if (!state.game) return state;
      if (state.status === "gameOverLost" || state.status === "gameOverWon") {
        return state;
      }

      let nextGame: Map<Coordinate, GameSquare>;
      let nextStatus: GameStatus = state.status;

      // First click: populate mines and start game
      if (state.status === "waitingStart") {
        // Deep-clone entries so populateMimes mutations don't leak
        // back into state.game (critical for React StrictMode
        // which double-invokes the reducer).
        const clonedEntries: [Coordinate, GameSquare][] = Array.from(
          state.game.entries(),
        ).map(([k, v]) => [k, { ...v }]);
        nextGame = populateMimes(
          clonedEntries,
          state.numMimes,
          state.boardSize,
          action.coordinate,
        );
        nextStatus = "inProgress";
      } else {
        nextGame = cloneGame(state.game);
      }

      const square = nextGame.get(action.coordinate);
      if (!square) return state;

      const result = processSquareClick(action.coordinate, nextGame, square);

      if (result.lost) {
        nextStatus = "gameOverLost";
        revealMinesOnLoss(nextGame, action.coordinate);
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

    case "SQUARE_RIGHT_CLICK": {
      if (!state.game) return state;
      if (state.status === "gameOverLost" || state.status === "gameOverWon") {
        return state;
      }

      const nextGame = cloneGame(state.game);
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
      if (state.status === "gameOverLost" || state.status === "gameOverWon") {
        return state;
      }

      const nextGame = cloneGame(state.game);
      const square = nextGame.get(action.coordinate);
      if (!square) return state;

      const result = processDoubleClick(action.coordinate, nextGame, square);

      let nextStatus: GameStatus = state.status;
      if (result.lost) {
        nextStatus = "gameOverLost";
        revealMinesOnLoss(nextGame, action.coordinate);
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
