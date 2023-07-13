import React, { useCallback, useEffect, useState } from 'react';
import { Layer, Stage } from 'react-konva';
import useInterval from 'useInterval';
import { Coordinate, EventType, GameSquare, GameStatus } from 'types';
import Square from './Square';
import gameOverImage from './images/mime_color.png';
import 'App.scss';

// Types of updates that can be made to Adjacent Squares. Options include updating
//  adjacentMime values or opening the squares
enum AdjacentUpdate {
  mimes = 'MIMES',
  open = 'OPEN',
  forceOpen = 'FORCE_OPEN',
}

// Number of Squares in the x & y direction of the play area
enum GridSize {
  XS = 5,
  S = 10,
  M = 20,
  L = 30,
  XL = 40,
}

// Number of Mimes to place in a play area
enum MimeSize {
  XS = 5,
  S = 20,
  M = 25,
  L = 50,
  XL = 100,
}

// Magic number. The amount of retries to allow for placing mimes until it will force-exit the while-loop
const INITIAL_FAILSAFE = 100;

// width/height of each square in px
const squareSide = 25;

// play area number of squares
const initialGridSize = GridSize.L;

// Initial number of mimes. On initialization of the game,
//  the squares with the mimes need to be initialized
const initialNumMimes: number = MimeSize.L;

// Additional score added based on speed of completion
//  bonus will count down by 10 every 5 seconds after initial 10 seconds
// 500 / 10 * 5 = 250 seconds + 10 initial seconds = 260 seconds until bonus reaches 0
// TODO implement
// const bonusTimeScore: number = 500;

// Interval delay of the timer. Defaults to 1s (1000ms)
const timeDelay: number = 1000; // 1 second

// Take in an x and y position and generate the coordinate key. Example generated key: x=5, y=4, returns '5|4'
function coOrdKey(x: number, y: number): Coordinate {
  return `${x}|${y}`;
}

// Given the board size, generate random coordinates within the board
function generateRandomCoOrd(boardSize: number): Coordinate {
  // generate a random location
  const x = Math.round(Math.random() * boardSize);
  const y = Math.round(Math.random() * boardSize);
  return coOrdKey(x, y);
}

// Given a Coordinate, return the values as an array of [x, y]
function getCoOrd(location: Coordinate): [number, number] {
  if (
    Number.isNaN(parseInt(location.slice(0, location.indexOf('|')), 10)) ||
    Number.isNaN(parseInt(location.slice(location.indexOf('|') + 1), 10))
  ) {
    throw new Error(
      `Unable to correctly parse x and y coordinates from given location string: "${location}"`
    );
  }
  return [
    parseInt(location.slice(0, location.indexOf('|')), 10),
    parseInt(location.slice(location.indexOf('|') + 1), 10),
  ];
}

interface AdjacentProps {
  // Coordinates of a square
  location: Coordinate;
  // Game that is being manipulated
  upcomingGame: Map<Coordinate, GameSquare>;
  // Type of update
  type?: AdjacentUpdate;
  // Size of the game board in number of squares
  boardSize: GridSize;
}

// function that will update squares adjacent to the square given by location.
//  Pass in the type to choose between updating adjacent mime value or opening the square
function updateAdjacent({
  location,
  upcomingGame,
  type = AdjacentUpdate.mimes,
  boardSize,
}: AdjacentProps) {
  const [x, y] = getCoOrd(location);
  Array.of(x - 1, x, x + 1).forEach((xVal) => {
    Array.of(y - 1, y, y + 1).forEach((yVal) => {
      if (!(xVal === x && yVal === y)) {
        // console.log(`works`);
        // it is not the center game square and xVal and yVal are in bounds
        const newSquareCoOrds = coOrdKey(xVal, yVal);
        const square = upcomingGame.get(newSquareCoOrds);
        if (!square) {
          // return out of this instance if square is not defined
          return;
        }
        if (type === AdjacentUpdate.mimes) {
          // Update number of Adjacent mimes (only update if the square is not a mime)
          if (!square.mime) {
            square.adjacentMimes += 1;
            upcomingGame.set(newSquareCoOrds, square);
          }
        }
        if (!square.flagged && !square.opened) {
          // if the square exists, it is not flagged, and it is not already opened
          if (type === AdjacentUpdate.open && !square.mime) {
            // Open Adjacent Squares recursively (do not open flagged squares)
            square.opened = true;
            if (square.adjacentMimes === 0) {
              updateAdjacent({
                location: newSquareCoOrds,
                upcomingGame,
                type: AdjacentUpdate.open,
                boardSize,
              });
            }
          } else if (type === AdjacentUpdate.forceOpen) {
            // even if there are mimes, open it up. Don't update recursively
            square.opened = true;
          }
        }
      }
    });
  });
}

interface FlaggedAdjacentProps {
  location: Coordinate;
  upcomingGame: Map<Coordinate, GameSquare>;
}

function allAdjacentMimesAreFlagged({
  location,
  upcomingGame,
}: FlaggedAdjacentProps): boolean {
  let flaggedAdjacent = 0;
  let adjacentMimes = 0;
  // return the number of flagged Adjacent squares
  const [x, y] = getCoOrd(location);
  Array.of(x - 1, x, x + 1).forEach((xVal) => {
    Array.of(y - 1, y, y + 1).forEach((yVal) => {
      if (!(xVal === x && yVal === y)) {
        // it is not the center game square and xVal and yVal are in bounds
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

function App() {
  // Handle state for the game
  const [game, setGame] = useState<Map<Coordinate, GameSquare> | null>(null);
  const [boardSize, setBoardSize] = useState(initialGridSize);
  const [status, setStatus] = useState<GameStatus>('waitingStart');
  // TODO state to implement game winning condition
  // const [isGameWon, setGameWon] = useState(false);
  const [numMimes, setNumMimes] = useState(initialNumMimes);
  const [numFlaggedMimes, setNumFlaggedMimes] = useState(0);
  const [playTime, setPlayTime] = useState(0);

  function populateMimes(
    entries: Array<[Coordinate, GameSquare]>,
    currentPieceCoOrds: Coordinate = '-1|-1'
  ): Map<Coordinate, GameSquare> {
    // reset mimeLocations as this is setting up a new Game
    const mimeLocations: Coordinate[] = [];
    // randomly populate with mimes - This should happen after the first click on a game square
    Array.from({ length: numMimes }).forEach(() => {
      let potentialMimeLocation: Coordinate = generateRandomCoOrd(boardSize);
      let failSafe = INITIAL_FAILSAFE;
      // if the potential location is included in the mime locations,
      //  generate new coordinates until it is no longer in the existing locations,
      //  the failSafe has been triggered, or the coordinates is not the same as the currentPieceCoOrds
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
    // Update game with mimes first, then update the adjacent squares
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
          // Update surrounding squares' adjacentMimes
          updateAdjacent({ location: mimeLocation, upcomingGame, boardSize });
        }
      });
    return upcomingGame;
  }

  const handleRightClick = (square: GameSquare): GameSquare => {
    if (!square.opened) {
      // this is a right click
      square.flagged = !square.flagged;
      if (square.flagged && square.mime) {
        setNumFlaggedMimes((prevState) => prevState + 1);
      }
    }
    return square;
  };

  const handleSquareClick = (
    coOrd: Coordinate,
    nextStateGame: Map<Coordinate, GameSquare>,
    square: GameSquare
  ): Map<Coordinate, GameSquare> => {
    if (square.mime && !square.flagged) {
      // not right-click, not a flag, and hit a mime. Game over
      square.opened = true;
      setStatus(() => 'gameOverLost');
    } else if (!square.flagged) {
      // not right-click, not a flag, and not a mime
      square.opened = true;
      if (square.adjacentMimes === 0) {
        // If there are no adjacentMimes, open all adjacent Squares
        updateAdjacent({
          location: coOrd,
          upcomingGame: nextStateGame,
          type: AdjacentUpdate.open,
          boardSize,
        });
      }
    }
    return nextStateGame;
  };

  const handleDoubleClick = (
    coOrd: Coordinate,
    nextStateGame: Map<Coordinate, GameSquare>,
    square: GameSquare
  ): Map<Coordinate, GameSquare> => {
    if (square.opened && square.adjacentMimes > 0) {
      if (
        !allAdjacentMimesAreFlagged({
          location: coOrd,
          upcomingGame: nextStateGame,
        })
      ) {
        // Game over! you found a un-flagged Mime
        setStatus(() => 'gameOverLost');
      }
      // open adjacent squares
      updateAdjacent({
        location: coOrd,
        upcomingGame: nextStateGame,
        type: AdjacentUpdate.forceOpen,
        boardSize,
      });
    }
    return nextStateGame;
  };

  const handleSquareSelect = (coOrd: Coordinate, type: EventType): void => {
    let nextStateGame: Map<Coordinate, GameSquare> | null = game;
    if (status === 'waitingStart' && game) {
      // Game just began! Populate the game board first
      nextStateGame = populateMimes(Array.from(game.entries()), coOrd);
      // Game is now in started state
      setStatus(() => 'inProgress');
    }
    let square = game?.get(coOrd);
    if (nextStateGame && square) {
      if (type === 'contextmenu') {
        square = handleRightClick(square);
      } else if (type === 'click') {
        handleSquareClick(coOrd, nextStateGame, square);
        // TODO game is over when numMimes === numFlagged AND the positions in the mimeLocations and flagLocations
        //  arrays are equivalent when sorted
      }
      if (type === 'dblclick') {
        handleDoubleClick(coOrd, nextStateGame, square);
      }
      nextStateGame.set(coOrd, square);
      setGame(() => new Map(nextStateGame));
    }
  };

  const newGame = useCallback((): Map<Coordinate, GameSquare> => {
    // use the Grid Size to generate a new Game Map
    const entries: Array<[Coordinate, GameSquare]> = Array.from({
      length: boardSize,
    }).reduce((prevValue: Array<[Coordinate, GameSquare]>, _, xIndex) => {
      // generate 0 to gridSize - 1 for the current index and concat to prevValue
      const currentList: Array<[Coordinate, GameSquare]> = Array.from({
        length: boardSize,
      }).map((__, yIndex) => [
        coOrdKey(xIndex, yIndex),
        {
          mime: false,
          adjacentMimes: 0,
          opened: false,
          flagged: false,
          isGameOver: status === 'gameOverWon' || status === 'gameOverLost',
          x: xIndex * squareSide,
          y: yIndex * squareSide,
        },
      ]);
      return prevValue.concat(currentList);
    }, []);
    return new Map<Coordinate, GameSquare>(entries);
  }, [boardSize, status]);

  function restart(mimes: number, size: GridSize = GridSize.XL): void {
    setStatus('waitingStart');
    setBoardSize(() => size);
    setNumMimes(() => mimes);
    setNumFlaggedMimes(() => 0);
    setPlayTime(0);
    setGame(() => newGame());
  }

  useInterval(
    () => {
      setPlayTime(playTime + 1);
    },
    status === 'inProgress' ? timeDelay : null
  );

  useEffect(() => {
    setGame(() => newGame());
    return function cleanup() {
      setGame(() => null);
    };
  }, []);

  return (
    <div
      className="container"
      style={{ minWidth: `${squareSide * boardSize}px` }}
    >
      {['gameOverLost', 'gameOverWon'].includes(status) ? (
        <div className="overlay">
          <div className="content">
            <h4>
              GAME OVER! You {status === 'gameOverLost' ? 'Lost :(' : 'Won! :)'}
            </h4>
            <img
              alt="Game Over!"
              src={gameOverImage}
              style={{ width: '8rem' }}
            />
            <p>New Game?</p>
            <div className="buttons">
              <button
                type="button"
                onClick={() => restart(MimeSize.S, GridSize.S)}
              >
                Small game
              </button>
              <button
                type="button"
                onClick={() => restart(MimeSize.M, GridSize.M)}
              >
                Medium game
              </button>
              <button
                type="button"
                onClick={() => restart(MimeSize.L, GridSize.L)}
              >
                Large game
              </button>
              <button
                type="button"
                onClick={() => restart(MimeSize.XL, GridSize.XL)}
              >
                XL game
              </button>
            </div>
          </div>
        </div>
      ) : (
        ''
      )}
      <h4>Mimesweeper</h4>
      <h4>
        <small>
          Play time: {playTime}s | Mimes Remaining: {numMimes - numFlaggedMimes}
        </small>
      </h4>
      <div className="mimes" style={{ width: `${squareSide * boardSize}px` }} />
      <Stage
        width={squareSide * boardSize}
        height={squareSide * boardSize}
        className="stage"
        data-test-id="stage"
      >
        <Layer>
          {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
          {Array.from(game ? game.entries() : []).map(([key, square]) => (
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
              isGameOver={status === 'gameOverLost' || status === 'gameOverWon'}
              onSelect={handleSquareSelect}
              onRightClick={handleSquareSelect}
              onDoubleClick={handleSquareSelect}
            />
          ))}
        </Layer>
      </Stage>
      <p style={{ marginTop: '1rem' }}>Restart?</p>
      <div className="buttons">
        <button type="button" onClick={() => restart(MimeSize.S, GridSize.S)}>
          Small game
        </button>
        <button type="button" onClick={() => restart(MimeSize.M, GridSize.M)}>
          Medium game
        </button>
        <button type="button" onClick={() => restart(MimeSize.L, GridSize.L)}>
          Large game
        </button>
        <button type="button" onClick={() => restart(MimeSize.XL, GridSize.XL)}>
          XL game
        </button>
      </div>
    </div>
  );
}

export default App;
