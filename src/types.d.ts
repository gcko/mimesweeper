// Interface describing the structure of a Square within a Game Grid.
import type { AdjacentUpdate } from "enums";

export interface GameSquare {
  // Does this square contain a mime?
  mime: boolean;
  // Number of adjacent mimes to this square. Can be a range of 0-8
  adjacentMimes: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  // Has this square been opened?
  opened: boolean;
  // Has this square been flagged as a mime?
  flagged: boolean;
  // Starting X value of the square
  x: number;
  // Starting Y value of the square
  y: number;
  // Was this the mime that the player clicked? (game over indicator)
  clickedMime?: boolean;
  // Was this square incorrectly flagged? (not actually a mime)
  wrongFlag?: boolean;
}

// Takes an x and y position and generates a coordinate. Example generated key: x=5, y=4, returns '5|4'
export type Coordinate = `${string}|${string}`;

export type EventType = "click" | "dblclick" | "contextmenu";

export type GameStatus =
  | "waitingStart"
  | "inProgress"
  | "gameOverLost"
  | "gameOverWon";

export interface AdjacentProps {
  // Coordinates of a square
  location: Coordinate;
  // Game that is being manipulated
  upcomingGame: Map<Coordinate, GameSquare>;
  // Type of update
  type?: AdjacentUpdate;
}

export interface FlaggedAdjacentProps {
  location: Coordinate;
  upcomingGame: Map<Coordinate, GameSquare>;
}
