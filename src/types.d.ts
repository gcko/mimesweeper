// Interface describing the structure of a Square within a Game Grid.
export interface GameSquare {
  // Does this square contain a mime?
  mime: boolean;
  // Number of adjacent mimes to this square. Can be a range of 0-8
  adjacentMimes: 0 | 1 | 2 | 3 | 4 | 5 | 7 | 8;
  // Has this square been opened?
  opened: boolean;
  // Has this square been flagged as a mime?
  flagged: boolean;
  // Is the game currently over?
  isGameOver: boolean;
  // Flag Image Element passed to the square
  flag: HTMLImageElement;
  // Image used when the game is over
  gameOverMime: HTMLImageElement;
  // Starting X value of the square
  x: number;
  // Starting Y value of the square
  y: number;
}

// Takes an x and y position and generates a coordinate. Example generated key: x=5, y=4, returns '5|4'
export type Coordinate = `${number}|${number}`;

export type EventType = 'click' | 'dblclick' | 'contextmenu';
