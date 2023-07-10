import React, { useCallback, useEffect, useState } from 'react';
import { Layer, Stage } from 'react-konva';
import { GameSquare } from 'types';
import Square from './Square';
import logo from './images/mime_bw.png';
import 'App.scss';

enum AdjacentUpdate {
  mimes = 'MIMES',
  open = 'OPEN',
}

enum GridSize {
  XS = 5,
  S = 10,
  M = 20,
  L = 30,
  XL = 40,
}

// width/height of each square in px
const squareSide = 25;

// play area number of squares
const initialGridSize = GridSize.XL;

// Initial number of mimes. On initialization of the game,
//  the squares with the mimes need to be initialized
const initialNumMimes: number = 100;

// Additional score added based on speed of completion
//  bonus will count down by 10 every 5 seconds after initial 10 seconds
// 500 / 10 * 5 = 250 seconds + 10 initial seconds = 260 seconds until bonus reaches 0
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const bonusTimeScore: number = 500;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const bonusTimeDelay: number = 1000; // 1 second

function coordKey(x: number, y: number): string {
  return `${x}|${y}`;
}

function generateCoord(boardSize: number): string {
  // generate a random location
  const x = Math.round(Math.random() * boardSize);
  const y = Math.round(Math.random() * boardSize);
  return coordKey(x, y);
}

function getCoord(location: string, xOrY: 'x' | 'y'): number {
  if (xOrY === 'x') {
    return parseInt(location.slice(0, location.indexOf('|')), 10);
  }
  return parseInt(location.slice(location.indexOf('|') + 1), 10);
}

function updateAdjacent(
  location: string,
  upcomingGame: Map<string, GameSquare>,
  type: AdjacentUpdate = AdjacentUpdate.mimes
) {
  const x = getCoord(location, 'x');
  const y = getCoord(location, 'y');
  Array.of(x - 1, x, x + 1).forEach((xVal) => {
    Array.of(y - 1, y, y + 1).forEach((yVal) => {
      if (
        (xVal !== x && yVal !== y) ||
        (xVal >= 0 &&
          yVal > 0 &&
          xVal < initialGridSize &&
          yVal < initialGridSize)
      ) {
        // it is not the center game piece and xVal and yVal are in bounds
        const coords = coordKey(xVal, yVal);
        const piece = upcomingGame.get(coords);
        if (type === AdjacentUpdate.mimes) {
          // Logic to handle updating number of Adjacent mimes
          if (piece && !piece.mime) {
            piece.adjacentMimes += 1;
            upcomingGame.set(coords, piece);
          }
        } else if (type === AdjacentUpdate.open) {
          // Logic to open Adjacent Squares
          if (piece) {
            piece.opened = true;
          }
        }
      }
    });
  });
}

function App() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [numMimes, setNumMimes] = useState(initialNumMimes);
  const [boardSize, setBoardSize] = useState(initialGridSize);
  const [game, setGame] = useState<Map<string, GameSquare> | null>(null);
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  function populateMimes(
    entries: Array<[string, GameSquare]>,
    safeHaven = '-1|-1'
  ) {
    // store mimeLocations to lookup during generation
    const mimeLocations: string[] = [];
    // randomly populate with mimes - This should happen after the first click on a game square
    Array.from({ length: numMimes }).forEach(() => {
      let potentialMimeLocation = generateCoord(boardSize);
      let failSafe = 100;
      // if the potential location is included in the mime locations,
      //  generate new coordinates until it is no longer in the existing locations,
      //  the failSafe has been triggered, or the coordinates is not the same as the safeHaven
      while (
        mimeLocations.includes(potentialMimeLocation) ||
        failSafe < 1 ||
        potentialMimeLocation === safeHaven
      ) {
        potentialMimeLocation = generateCoord(boardSize);
        failSafe -= 1;
      }
      mimeLocations.push(potentialMimeLocation);
    });
    const upcomingGame = new Map<string, GameSquare>(entries);
    // Update game with mimes first, then update the adjacent squares
    mimeLocations
      .map((location) => {
        const square = upcomingGame.get(location);
        if (square) {
          square.mime = true;
          upcomingGame.set(location, square);
        }
        return location;
      })
      .forEach((location) => {
        const square = upcomingGame.get(location);
        if (square) {
          // Update surrounding squares' adjacentMimes
          updateAdjacent(location, upcomingGame);
        }
      });
    return upcomingGame;
  }

  const handleSquareSelect = (coord: string) => {
    let nextStateGame: Map<string, GameSquare> | null = game;
    if (!started && game) {
      // Game just began! need to populate the game board first
      nextStateGame = populateMimes(Array.from(game.entries()), coord);
      // game is now in started state
      setStarted(() => true);
    }
    const square = game?.get(coord);
    if (nextStateGame && square) {
      if (square.mime) {
        console.warn('MIME! GAME OVER!');
        square.opened = true;
        setGameOver(true);
      } else {
        // not a mime
        square.opened = true;
        if (square.adjacentMimes === 0) {
          // If there are no adjacentMimes, open all adjacent Squares
          updateAdjacent(coord, nextStateGame, AdjacentUpdate.open);
        }
      }
      nextStateGame.set(coord, square);
      setGame(() => new Map(nextStateGame));
    }
  };

  const newGame = useCallback((): Map<string, GameSquare> => {
    // use the Grid Size to generate a new Game Map
    const entries: Array<[string, GameSquare]> = Array.from({
      length: initialGridSize,
    }).reduce((prevValue: Array<[string, GameSquare]>, _, xIndex) => {
      // generate 0 to gridSize - 1 for the current index and concat to prevValue
      const currentList: Array<[string, GameSquare]> = Array.from({
        length: initialGridSize,
        // eslint-disable-next-line @typescript-eslint/no-shadow
      }).map((_, yIndex) => [
        coordKey(xIndex, yIndex),
        {
          mime: false,
          adjacentMimes: 0,
          opened: false,
          x: xIndex * squareSide,
          y: yIndex * squareSide,
        },
      ]);
      return prevValue.concat(currentList);
    }, []);
    return new Map<string, GameSquare>(entries);
  }, []);

  function restart(mimes: number, size: GridSize = GridSize.XL): void {
    setGameOver(() => false);
    setBoardSize(() => size);
    setNumMimes(() => mimes);
    setStarted(() => false);
    setGame(() => newGame());
  }

  useEffect(() => {
    setGame(() => newGame());
    return function cleanup() {
      setGame(() => null);
    };
  }, [newGame]);

  return (
    <div className="container">
      {gameOver ? (
        <div className="overlay">
          <div className="content">
            <h4>GAME OVER</h4>
            <button type="button" onClick={() => restart(20, GridSize.M)}>
              Start a new medium game
            </button>
            <button type="button" onClick={() => restart(50, GridSize.L)}>
              Start a new large game
            </button>
            <button type="button" onClick={() => restart(100, GridSize.XL)}>
              Start a new xl game
            </button>
          </div>
        </div>
      ) : (
        ''
      )}
      <h4>Mimesweeper</h4>
      <div className="mimes">
        <img alt="logo" src={logo} style={{ width: '4rem' }} />
        <img alt="logo" src={logo} style={{ width: '4rem' }} />
        <img alt="logo" src={logo} style={{ width: '4rem' }} />
        <img alt="logo" src={logo} style={{ width: '4rem' }} />
        <img alt="logo" src={logo} style={{ width: '4rem' }} />
        <img alt="logo" src={logo} style={{ width: '4rem' }} />
        <img alt="logo" src={logo} style={{ width: '4rem' }} />
        <img alt="logo" src={logo} style={{ width: '4rem' }} />
        <img alt="logo" src={logo} style={{ width: '4rem' }} />
        <img alt="logo" src={logo} style={{ width: '4rem' }} />
        <img alt="logo" src={logo} style={{ width: '4rem' }} />
        <img alt="logo" src={logo} style={{ width: '4rem' }} />
        <img alt="logo" src={logo} style={{ width: '4rem' }} />
        <img alt="logo" src={logo} style={{ width: '4rem' }} />
        <img alt="logo" src={logo} style={{ width: '4rem' }} />
      </div>
      <Stage
        width={squareSide * boardSize}
        height={squareSide * boardSize}
        className="stage"
      >
        <Layer>
          {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
          {Array.from(game ? game.entries() : []).map(([key, square]) => (
            <Square
              key={key}
              coord={key}
              x={square.x}
              y={square.y}
              size={squareSide}
              mime={square.mime}
              adjacentMimes={square.adjacentMimes}
              opened={square.opened}
              onSelect={handleSquareSelect}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}

export default App;
