import type { Coordinate } from "types.d";
import { coOrdKey, getCoOrd } from "./coordinates.ts";

const OFFSETS = [-1, 0, 1] as const;

/** Returns all 8 neighbor coordinates around a given location. */
export function getNeighborCoords(location: Coordinate): Coordinate[] {
  const [x, y] = getCoOrd(location);
  const neighbors: Coordinate[] = [];
  for (const dx of OFFSETS) {
    for (const dy of OFFSETS) {
      if (dx !== 0 || dy !== 0) {
        neighbors.push(coOrdKey(x + dx, y + dy));
      }
    }
  }
  return neighbors;
}
