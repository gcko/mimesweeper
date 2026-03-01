import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { Layer, Stage } from "react-konva";
import type { Coordinate, DifficultyKey, EventType } from "types.d";
import { GridSize, MimeSize } from "./enums.ts";
import { gameReducer, initialState } from "./gameReducer.ts";
import { useScoreboard } from "./hooks/useScoreboard.ts";
import { useWindowSize } from "./hooks/useWindowSize.ts";
import gameOverImage from "./images/mime_color.png";
import Scoreboard from "./Scoreboard";
import Square from "./Square";
import useInterval from "./useInterval";
import { computeSquareSide } from "./utils/responsive.ts";
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

function getDifficultyKey(boardSize: GridSize): DifficultyKey {
  switch (boardSize) {
    case GridSize.M:
      return "M";
    case GridSize.L:
      return "L";
    case GridSize.XL:
      return "XL";
    default:
      return "S";
  }
}

function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { game, boardSize, status, numFlags, playTime, showRules, score } =
    state;

  const { width: viewportWidth } = useWindowSize();
  const squareSide = useMemo(
    () => computeSquareSide(viewportWidth, boardSize),
    [viewportWidth, boardSize],
  );

  const { getScores, isHighScore, addScore } = useScoreboard();
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  const isGameOver = status === "gameOverLost" || status === "gameOverWon";
  const difficultyKey = getDifficultyKey(boardSize);
  const qualifiesForHighScore =
    status === "gameOverWon" &&
    !scoreSubmitted &&
    isHighScore(difficultyKey, score);

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
      const newSquareSide = computeSquareSide(viewportWidth, size);
      dispatch({
        type: "START_GAME",
        boardSize: size,
        numMimes: mimes,
        squareSide: newSquareSide,
      });
      setPlayerName("");
      setScoreSubmitted(false);
    },
    [viewportWidth],
  );

  useInterval(
    () => {
      dispatch({ type: "TICK" });
    },
    status === "inProgress" ? timeDelay : null,
  );

  useEffect(() => {
    if (status === "waitingStart" && boardSize > 0) {
      dispatch({ type: "INIT_BOARD", squareSide });
    }
  }, [status, boardSize, squareSide]);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(".board-scroll")) {
        e.preventDefault();
      }
    };
    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  const gameEntries = useMemo(
    () => Array.from(game ? game.entries() : []),
    [game],
  );

  return (
    <div
      className="container"
      style={{ maxWidth: `${squareSide * boardSize + 32}px` }}
    >
      {showRules ? (
        <div className="overlay">
          <div className="content">
            <h4>How to Play</h4>
            <ol>
              <li>Click or tap to open a space</li>
              <li>Right-click or long-press to flag a space</li>
              <li>
                Double-click or double-tap to open all adjacent un-flagged
                spaces
              </li>
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
      {showScoreboard ? (
        <Scoreboard
          getScores={getScores}
          onClose={() => setShowScoreboard(false)}
        />
      ) : null}
      {isGameOver ? (
        <div className="overlay">
          <div className="content">
            <h4>
              GAME OVER! You {status === "gameOverLost" ? "Lost :(" : "Won! :)"}
            </h4>
            {status === "gameOverWon" && (
              <>
                <h2 className="final-score">Score: {score}</h2>
                {qualifiesForHighScore ? (
                  <div className="high-score-entry">
                    <p>New High Score!</p>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="Your name"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                    />
                    <button
                      type="button"
                      disabled={playerName.trim().length === 0}
                      onClick={() => {
                        addScore(difficultyKey, playerName.trim(), score);
                        setScoreSubmitted(true);
                      }}
                    >
                      Submit Score
                    </button>
                  </div>
                ) : scoreSubmitted ? (
                  <p>Score saved!</p>
                ) : null}
              </>
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
      <header className="game-header">
        <h1 className="game-title">Mimesweeper</h1>
        <nav className="game-nav">
          <button
            type="button"
            onClick={() => {
              dispatch({ type: "TOGGLE_RULES" });
            }}
          >
            How to play
          </button>
          <button
            type="button"
            onClick={() => {
              setShowScoreboard(true);
            }}
          >
            Scoreboard
          </button>
        </nav>
        <div className="game-stats">
          <span>Play time: {playTime}s</span>
          <span>Score: {score}</span>
          <span>
            Flags Remaining: {numFlags < 0 ? "No more left!" : numFlags}
          </span>
        </div>
      </header>
      <div className="mimes" style={{ width: `${squareSide * boardSize}px` }} />
      <div className="board-scroll">
        <Stage
          width={squareSide * boardSize}
          height={squareSide * boardSize}
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
                size={squareSide}
                mime={square.mime}
                adjacentMimes={square.adjacentMimes}
                opened={square.opened}
                flagged={square.flagged}
                clickedMime={square.clickedMime}
                wrongFlag={square.wrongFlag}
                isGameOver={isGameOver}
                onSelect={handleSquareSelect}
                onRightClick={handleSquareSelect}
                onDoubleClick={handleSquareSelect}
              />
            ))}
          </Layer>
        </Stage>
      </div>
      <p style={{ marginTop: "1rem" }}>Restart?</p>
      <div className="buttons">
        <DifficultyButtons onRestart={handleRestart} />
      </div>
    </div>
  );
}

export default App;
