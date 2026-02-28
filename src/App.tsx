import { useEffect, useState } from "react";
import { Layer, Stage } from "react-konva";
import type { Coordinate, EventType, GameSquare, GameStatus } from "types.d";
import { GridSize, MimeSize } from "./enums.ts";
import gameOverImage from "./images/mime_color.png";
import Square from "./Square";
import useInterval from "./useInterval";
import {
  isWin,
  newGame,
  populateMimes,
  processDoubleClick,
  processRightClick,
  processSquareClick,
  SQUARE_SIDE,
} from "./utils/gameLogic.ts";
import "App.css";

// Interval delay of the timer. Defaults to 1s (1000ms)
const timeDelay = 1000; // 1 second

function App() {
  const [game, setGame] = useState<Map<Coordinate, GameSquare> | null>(null);
  const [boardSize, setBoardSize] = useState(GridSize.S);
  const [status, setStatus] = useState<GameStatus>("waitingStart");
  const [numMimes, setNumMimes] = useState(MimeSize.S);
  const [numFlags, setNumFlags] = useState<number>(MimeSize.S);
  // biome-ignore lint/correctness/noUnusedVariables: state setter used internally
  const [numOpenSpaces, setNumOpenSpaces] = useState(0);
  const [playTime, setPlayTime] = useState(0);
  const [showRules, setShowRules] = useState(false);

  const handleSquareSelect = (coOrd: Coordinate, type: EventType): void => {
    let nextStateGame: Map<Coordinate, GameSquare> | null = game;
    if (status === "waitingStart" && game) {
      nextStateGame = populateMimes(
        Array.from(game.entries()),
        numMimes,
        boardSize,
        coOrd,
      );
      setStatus(() => "inProgress");
    }
    const square = game?.get(coOrd);
    if (nextStateGame && square) {
      if (type === "contextmenu") {
        const flagDelta = processRightClick(square);
        if (flagDelta !== 0) {
          setNumFlags((prev) => prev + flagDelta);
        }
      } else if (type === "click") {
        const result = processSquareClick(coOrd, nextStateGame, square);
        if (result.lost) {
          setStatus("gameOverLost");
        } else {
          setNumOpenSpaces((prev) => {
            const newCount = prev + result.openedCount;
            if (isWin(numMimes, newCount, boardSize)) {
              setStatus("gameOverWon");
            }
            return newCount;
          });
        }
      } else {
        const result = processDoubleClick(coOrd, nextStateGame, square);
        if (result.lost) {
          setStatus("gameOverLost");
        }
        setNumOpenSpaces((prev) => {
          const newCount = prev + result.openedCount;
          if (isWin(numMimes, newCount, boardSize)) {
            setStatus("gameOverWon");
          }
          return newCount;
        });
      }
      nextStateGame.set(coOrd, square);
      setGame(() => new Map(nextStateGame));
    }
  };

  function restart(mimes = MimeSize.S, size: GridSize = GridSize.S): void {
    setStatus("waitingStart");
    setNumMimes(mimes);
    setNumFlags(mimes);
    setNumOpenSpaces(0);
    setPlayTime(0);
    setBoardSize(size);
  }

  useInterval(
    () => {
      setPlayTime(playTime + 1);
    },
    status === "inProgress" ? timeDelay : null,
  );

  useEffect(() => {
    if (status === "waitingStart") {
      setGame(() => newGame(boardSize, SQUARE_SIDE));
    }
  }, [status, boardSize]);

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
                  setShowRules(false);
                }}
              >
                Let&apos;s play!
              </button>
            </div>
          </div>
        </div>
      ) : (
        ""
      )}
      {["gameOverLost", "gameOverWon"].includes(status) ? (
        <div className="overlay">
          <div className="content">
            <h4>
              GAME OVER! You {status === "gameOverLost" ? "Lost :(" : "Won! :)"}
            </h4>
            <img
              alt="Game Over!"
              src={gameOverImage}
              style={{ width: "8rem" }}
            />
            <p>New Game?</p>
            <div className="buttons">
              <button
                type="button"
                onClick={() => {
                  restart(MimeSize.S, GridSize.S);
                }}
              >
                Small game
              </button>
              <button
                type="button"
                onClick={() => {
                  restart(MimeSize.M, GridSize.M);
                }}
              >
                Medium game
              </button>
              <button
                type="button"
                onClick={() => {
                  restart(MimeSize.L, GridSize.L);
                }}
              >
                Large game
              </button>
              <button
                type="button"
                onClick={() => {
                  restart(MimeSize.XL, GridSize.XL);
                }}
              >
                XL game
              </button>
            </div>
          </div>
        </div>
      ) : (
        ""
      )}
      <h4>
        Mimesweeper{" "}
        <button
          type="button"
          onClick={() => {
            setShowRules(true);
          }}
        >
          How to play
        </button>
      </h4>
      <h4>
        <small>
          Play time: {playTime}s | Flags Remaining:{" "}
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
          {Array.from(game ? game.entries() : []).map(([key, square]) => (
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
              isGameOver={status === "gameOverLost" || status === "gameOverWon"}
              onSelect={handleSquareSelect}
              onRightClick={handleSquareSelect}
              onDoubleClick={handleSquareSelect}
            />
          ))}
        </Layer>
      </Stage>
      <p style={{ marginTop: "1rem" }}>Restart?</p>
      <div className="buttons">
        <button
          type="button"
          onClick={() => {
            restart(MimeSize.S, GridSize.S);
          }}
        >
          Small game
        </button>
        <button
          type="button"
          onClick={() => {
            restart(MimeSize.M, GridSize.M);
          }}
        >
          Medium game
        </button>
        <button
          type="button"
          onClick={() => {
            restart(MimeSize.L, GridSize.L);
          }}
        >
          Large game
        </button>
        <button
          type="button"
          onClick={() => {
            restart(MimeSize.XL, GridSize.XL);
          }}
        >
          XL game
        </button>
      </div>
    </div>
  );
}

export default App;
