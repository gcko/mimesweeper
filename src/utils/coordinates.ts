// Take in an x and y position and generate the coordinate key. Example generated key: x=5, y=4, returns '5|4'
import type { Coordinate } from "types";

export function coOrdKey(x: number, y: number): Coordinate {
  return `${String(x)}|${String(y)}`;
}

// Given the board size, generate random coordinates within the board
export function generateRandomCoOrd(boardSize: number): Coordinate {
  // generate a random location
  const x = Math.floor(Math.random() * boardSize);
  const y = Math.floor(Math.random() * boardSize);
  return coOrdKey(x, y);
}

// Given a Coordinate, return the values as an array of [x, y]
export function getCoOrd(location: Coordinate): [number, number] {
  const [xStr, yStr] = location.split("|");
  const x = parseInt(xStr, 10);
  const y = parseInt(yStr, 10);
  if (Number.isNaN(x) || Number.isNaN(y)) {
    throw new Error(
      `Unable to correctly parse x and y coordinates from given location string: "${location}"`,
    );
  }
  return [x, y];
}
