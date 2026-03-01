import { coOrdKey } from "./coordinates.ts";
import { getNeighborCoords } from "./neighbors.ts";

describe("getNeighborCoords", () => {
  test("returns 8 neighbors for a center position", () => {
    const neighbors = getNeighborCoords("2|2");
    expect(neighbors).toHaveLength(8);
    expect(neighbors).toContain(coOrdKey(1, 1));
    expect(neighbors).toContain(coOrdKey(1, 2));
    expect(neighbors).toContain(coOrdKey(1, 3));
    expect(neighbors).toContain(coOrdKey(2, 1));
    expect(neighbors).toContain(coOrdKey(2, 3));
    expect(neighbors).toContain(coOrdKey(3, 1));
    expect(neighbors).toContain(coOrdKey(3, 2));
    expect(neighbors).toContain(coOrdKey(3, 3));
  });

  test("does NOT include the center coordinate itself", () => {
    const neighbors = getNeighborCoords("2|2");
    expect(neighbors).not.toContain(coOrdKey(2, 2));
  });

  test("returns coordinates for corner position (0,0)", () => {
    const neighbors = getNeighborCoords("0|0");
    expect(neighbors).toHaveLength(8);
    // Includes negative coordinates — filtering is the caller's job
    expect(neighbors).toContain(coOrdKey(-1, -1));
    expect(neighbors).toContain(coOrdKey(1, 1));
  });
});
