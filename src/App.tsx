import React, { useCallback, useEffect, useState } from 'react';
import { Layer, Stage } from 'react-konva';
import { GameSquare } from 'types';
import Square from './Square';
import logo from './images/mime_bw.png';
import 'App.scss';

// width/height of each square in px
const squareSide = 25;
// play area number of squares
const gridSize = 40;
const gridX: number = squareSide * gridSize; // 24 * 40 = 1000
const gridY: number = squareSide * gridSize; // 24 * 40 = 1000
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const scale = 50;

// Example Grid
// [
//  [0,0],[0,1],[0,2],...,[0,39]
//  [1,0],[1,1],[1,2],...,[1,39]
//  ...
//  [39,0],[39,1],[39,2],...,[39,39]
// ]

function coord(x: number, y: number): string {
  return `${x}|${y}`;
}

function generateCoord(): string {
  // generate a random location
  const x = Math.round(Math.random() * gridSize);
  const y = Math.round(Math.random() * gridSize);
  return coord(x, y);
}

function App() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [numMimes, setNumMimes] = useState(initialNumMimes);
  const [game, setGame] = useState<Map<string, GameSquare> | null>(null);

  const newGame = useCallback((): Map<string, GameSquare> => {
    // use numMimes and the Grid Size to generate a new Game Map
    // store mimeLocations to lookup during generation
    const mimeLocations: string[] = [];
    const entries: Array<[string, GameSquare]> = Array.from({
      length: gridSize,
    }).reduce((prevValue: Array<[string, GameSquare]>, _, xIndex) => {
      // generate 0 to gridSize - 1 for the current index and concat to prevValue
      const currentList: Array<[string, GameSquare]> = Array.from({
        length: gridSize,
        // eslint-disable-next-line @typescript-eslint/no-shadow
      }).map((_, yIndex) => [
        coord(xIndex, yIndex),
        {
          mime: false,
          adjacentMimes: 0,
          x: xIndex * squareSide,
          y: yIndex * squareSide,
        },
      ]);
      return prevValue.concat(currentList);
    }, []);
    // randomly populate with mimes
    Array.from({ length: numMimes }).forEach(() => {
      let potentialMimeLocation = generateCoord();
      let failSafe = 20;
      // if the potential location is included in the mime locations,
      //  generate new coordinates until it is no longer OR the failSafe has been triggered
      while (mimeLocations.includes(potentialMimeLocation) || failSafe < 1) {
        potentialMimeLocation = generateCoord();
        failSafe -= 1;
      }
      mimeLocations.push(potentialMimeLocation);
    });
    const upcomingGame = new Map<string, GameSquare>(entries);
    // Update game with mimes
    mimeLocations.forEach((location) => {
      const square = upcomingGame.get(location);
      if (square) {
        square.mime = true;
        upcomingGame.set(location, square);
      }
    });
    return upcomingGame;
  }, [numMimes]);

  useEffect(() => {
    setGame(() => newGame());
    return function cleanup() {
      setGame(() => null);
    };
  }, [newGame]);

  return (
    <div className="container">
      <h4>Mimesweeper</h4>
      <img alt="logo" src={logo} style={{ width: '4rem' }} />
      <Stage width={gridX} height={gridY}>
        <Layer>
          {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
          {Array.from(game ? game.entries() : []).map(([_, square]) => (
            <Square
              key={`${square.x}|${square.y}`}
              x={square.x}
              y={square.y}
              size={squareSide}
              mime={square.mime}
              adjacentMimes={square.adjacentMimes}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}

export default App;
