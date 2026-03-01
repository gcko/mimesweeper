import { useCallback, useEffect, useMemo, useReducer } from "react";
import { Layer, Stage } from "react-konva";
import type { Coordinate, EventType } from "types.d";
import { GridSize, MimeSize } from "./enums.ts";
import { gameReducer, initialState } from "./gameReducer.ts";
import gameOverImage from "./images/mime_color.png";
import Square from "./Square";
import useInterval from "./useInterval";
import { SQUARE_SIDE } from "./utils/gameLogic.ts";
import "App.css";

// Interval delay of the timer. Defaults to 1s (1000ms)
const timeDelay = 1000; // 1 second

interface DifficultyButtonsProps {
  onRestart: (mimes: MimeSize, size: GridSize) => void;
}

function DifficultyButtons({ onRestart }: DifficultyButtonsProps) {
  return (
    <>
      <button
        type="button"
        onClick={() => {
          onRestart(MimeSize.S, GridSize.S);
        }}
      >
        Small game
      </button>
      <button
        type="button"
        onClick={() => {
          onRestart(MimeSize.M, GridSize.M);
        }}
      >
        Medium game
      </button>
      <button
        type="button"
        onClick={() => {
          onRestart(MimeSize.L, GridSize.L);
        }}
      >
        Large game
      </button>
      <button
        type="button"
        onClick={() => {
          onRestart(MimeSize.XL, GridSize.XL);
        }}
      >
        XL game
      </button>
    </>
  );
}

function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { game, boardSize, status, numFlags, playTime, showRules, score } =
    state;

  const isGameOver = status === "gameOverLost" || status === "gameOverWon";

  const handleSquareSelect = useCallback(
    (coOrd: Coordinate, type: EventType): void => {
      switch (type) {
        case "click":
          dispatch({ type: "SQUARE_CLICK", coordinate: coOrd });
          break;
        case "contextmenu":
          dispatch({ type: "SQUARE_RIGHT_CLICK", coordinate: coOrd });
          break;
        case "dblclick":
          dispatch({ type: "SQUARE_DOUBLE_CLICK", coordinate: coOrd });
          break;
      }
    },
    [],
  );

  const handleRestart = useCallback(
    (mimes: MimeSize = MimeSize.S, size: GridSize = GridSize.S): void => {
      dispatch({ type: "START_GAME", boardSize: size, numMimes: mimes });
    },
    [],
  );

  useInterval(
    () => {
      dispatch({ type: "TICK" });
    },
    status === "inProgress" ? timeDelay : null,
  );

  useEffect(() => {
    if (status === "waitingStart" && boardSize > 0) {
      dispatch({ type: "INIT_BOARD" });
    }
  }, [status, boardSize]);

  const gameEntries = useMemo(
    () => Array.from(game ? game.entries() : []),
    [game],
  );

  return (
    <div
      className="container"
      style={{ minWidth: `${String(SQUARE_SIDE * boardSize)}px` }}
    >
      {showRules ? (
        <div className="overlay">
          <div className="content">
            <h4>How to Play</h4>
            <ol>
              <li>Left click to open a space</li>
              <li>Right click to flag a space</li>
              <li>Double click to open all adjacent un-flagged spaces</li>
            </ol>
            <div className="buttons">
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: "TOGGLE_RULES" });
                }}
              >
                Let&apos;s play!
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {isGameOver ? (
        <div className="overlay">
          <div className="content">
            <h4>
              GAME OVER! You {status === "gameOverLost" ? "Lost :(" : "Won! :)"}
            </h4>
            {status === "gameOverWon" && (
              <h2 className="final-score">Score: {score}</h2>
            )}
            <img
              alt="Game Over!"
              src={gameOverImage}
              style={{ width: "8rem" }}
            />
            <p>New Game?</p>
            <div className="buttons">
              <DifficultyButtons onRestart={handleRestart} />
            </div>
          </div>
        </div>
      ) : null}
      <h4>
        Mimesweeper{" "}
        <button
          type="button"
          onClick={() => {
            dispatch({ type: "TOGGLE_RULES" });
          }}
        >
          How to play
        </button>
      </h4>
      <h4>
        <small>
          Play time: {playTime}s | Score: {score} | Flags Remaining:{" "}
          {numFlags < 0 ? "No more left!" : numFlags}
        </small>
      </h4>
      <div
        className="mimes"
        style={{ width: `${String(SQUARE_SIDE * boardSize)}px` }}
      />
      <Stage
        width={SQUARE_SIDE * boardSize}
        height={SQUARE_SIDE * boardSize}
        className="stage"
        data-test-id="stage"
      >
        <Layer>
          {gameEntries.map(([key, square]) => (
            <Square
              key={key}
              coOrd={key}
              x={square.x}
              y={square.y}
              size={SQUARE_SIDE}
              mime={square.mime}
              adjacentMimes={square.adjacentMimes}
              opened={square.opened}
              flagged={square.flagged}
              isGameOver={isGameOver}
              onSelect={handleSquareSelect}
              onRightClick={handleSquareSelect}
              onDoubleClick={handleSquareSelect}
            />
          ))}
        </Layer>
      </Stage>
      <p style={{ marginTop: "1rem" }}>Restart?</p>
      <div className="buttons">
        <DifficultyButtons onRestart={handleRestart} />
      </div>
    </div>
  );
}

export default App;
