import React, { useCallback, useEffect, useState } from 'react';
import { Layer, Stage } from 'react-konva';
import useImage from 'use-image';
import useInterval from 'useInterval';
import { GameSquare } from 'types';
import image from 'images/stop.png';
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
const timeDelay: number = 1000; // 1 second

function coOrdKey(x: number, y: number): string {
  return `${x}|${y}`;
}

function generateCoOrd(boardSize: number): string {
  // generate a random location
  const x = Math.round(Math.random() * boardSize);
  const y = Math.round(Math.random() * boardSize);
  return coOrdKey(x, y);
}

function getCoOrd(location: string, xOrY: 'x' | 'y'): number {
  if (xOrY === 'x') {
    return parseInt(location.slice(0, location.indexOf('|')), 10);
  }
  return parseInt(location.slice(location.indexOf('|') + 1), 10);
}

interface AdjacentProps {
  location: string;
  upcomingGame: Map<string, GameSquare>;
  type?: AdjacentUpdate;
  boardSize: GridSize;
}

function updateAdjacent({
  location,
  upcomingGame,
  type = AdjacentUpdate.mimes,
  boardSize,
}: AdjacentProps) {
  const x = getCoOrd(location, 'x');
  const y = getCoOrd(location, 'y');
  Array.of(x - 1, x, x + 1).forEach((xVal) => {
    Array.of(y - 1, y, y + 1).forEach((yVal) => {
      if (
        (xVal !== x && yVal !== y) ||
        (xVal >= 0 && yVal >= 0 && xVal < boardSize && yVal < boardSize)
      ) {
        // it is not the center game piece and xVal and yVal are in bounds
        const coords = coOrdKey(xVal, yVal);
        const piece = upcomingGame.get(coords);
        if (type === AdjacentUpdate.mimes) {
          // Logic to handle updating number of Adjacent mimes
          if (piece && !piece.mime) {
            piece.adjacentMimes += 1;
            upcomingGame.set(coords, piece);
          }
        } else if (type === AdjacentUpdate.open) {
          // Logic to open Adjacent Squares (won't open flagged squares)
          if (piece && !piece.flagged) {
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
  const [isStarted, setStarted] = useState(false);
  const [isGameOver, setGameOver] = useState(false);
  const [flag] = useImage(image);
  const [playTime, setPlayTime] = useState(0);
  // numFlags -> equivalent to the number of mimes
  // numFlagged -> hold on to this, then you can calculate the number of flags remaining

  function populateMimes(
    entries: Array<[string, GameSquare]>,
    safeHaven = '-1|-1'
  ) {
    // store mimeLocations to lookup during generation
    const mimeLocations: string[] = [];
    // randomly populate with mimes - This should happen after the first click on a game square
    Array.from({ length: numMimes }).forEach(() => {
      let potentialMimeLocation = generateCoOrd(boardSize);
      let failSafe = 100;
      // if the potential location is included in the mime locations,
      //  generate new coordinates until it is no longer in the existing locations,
      //  the failSafe has been triggered, or the coordinates is not the same as the safeHaven
      while (
        mimeLocations.includes(potentialMimeLocation) ||
        failSafe < 1 ||
        potentialMimeLocation === safeHaven
      ) {
        potentialMimeLocation = generateCoOrd(boardSize);
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
          updateAdjacent({ location, upcomingGame, boardSize });
        }
      });
    return upcomingGame;
  }

  const handleSquareSelect = (coord: string, e: MouseEvent | PointerEvent) => {
    let nextStateGame: Map<string, GameSquare> | null = game;
    if (!isStarted && game) {
      // Game just began! need to populate the game board first
      nextStateGame = populateMimes(Array.from(game.entries()), coord);
      // game is now in started state
      setStarted(() => true);
    }
    const square = game?.get(coord);
    if (nextStateGame && square) {
      if (e.type === 'contextmenu') {
        // this is a right click
        square.flagged = !square.flagged;
      } else if (square.mime && !square.flagged) {
        // not right-click, not a flag, and hit a mime. Game over
        square.opened = true;
        setGameOver(true);
      } else if (!square.flagged) {
        // not right-click, not a flag, and not a mime
        square.opened = true;
        if (square.adjacentMimes === 0) {
          // If there are no adjacentMimes, open all adjacent Squares
          updateAdjacent({
            location: coord,
            upcomingGame: nextStateGame,
            type: AdjacentUpdate.open,
            boardSize,
          });
        }
        // TODO game is over if numMimes === numFlagged === num unopened squares. Better yet, bump mimeLocations up
        //  to the parent context and also hold onto flagLocations, sorted. then you can compare the two during the times
        //  when numMimes === numFlagged. this significantly reduces computation
      }
      nextStateGame.set(coord, square);
      setGame(() => new Map(nextStateGame));
    }
  };

  const newGame = useCallback((): Map<string, GameSquare> => {
    // use the Grid Size to generate a new Game Map
    const entries: Array<[string, GameSquare]> = Array.from({
      length: boardSize,
    }).reduce((prevValue: Array<[string, GameSquare]>, _, xIndex) => {
      // generate 0 to gridSize - 1 for the current index and concat to prevValue
      const currentList: Array<[string, GameSquare]> = Array.from({
        length: boardSize,
        // eslint-disable-next-line @typescript-eslint/no-shadow
      }).map((_, yIndex) => [
        coOrdKey(xIndex, yIndex),
        {
          mime: false,
          adjacentMimes: 0,
          opened: false,
          flagged: false,
          flag: flag as HTMLImageElement,
          x: xIndex * squareSide,
          y: yIndex * squareSide,
        },
      ]);
      return prevValue.concat(currentList);
    }, []);
    return new Map<string, GameSquare>(entries);
  }, [boardSize, flag]);

  const handleContextMenu = useCallback((event: MouseEvent) => {
    event.preventDefault();
  }, []);

  function restart(mimes: number, size: GridSize = GridSize.XL): void {
    setGameOver(() => false);
    setBoardSize(() => size);
    setNumMimes(() => mimes);
    setStarted(() => false);
    setPlayTime(0);
    setGame(() => newGame());
  }

  useInterval(
    () => {
      setPlayTime(playTime + 1);
    },
    isStarted && !isGameOver ? timeDelay : null
  );

  useEffect(() => {
    setGame(() => newGame());
    document.addEventListener('contextmenu', handleContextMenu);
    return function cleanup() {
      document.removeEventListener('contextmenu', handleContextMenu);
      setGame(() => null);
    };
  }, [handleContextMenu, newGame]);

  return (
    <div className="container">
      {isGameOver ? (
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
      <h4>
        Mimesweeper <small>Play time: {playTime}s</small>
      </h4>
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
              flagged={square.flagged}
              flag={square.flag}
              onSelect={handleSquareSelect}
              onRightClick={handleSquareSelect}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}

export default App;
