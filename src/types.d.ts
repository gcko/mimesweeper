export interface GameSquare {
  mime: boolean;
  adjacentMimes: 0 | 1 | 2 | 3 | 4 | 5 | 7 | 8;
  opened: boolean;
  flagged: boolean;
  isGameOver: boolean;
  flag: HTMLImageElement;
  gameOverMime: HTMLImageElement;
  x: number; // starting x value
  y: number; // starting y value
}
