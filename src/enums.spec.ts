import { AdjacentUpdate, GridSize, MimeSize } from "./enums.ts";

describe("AdjacentUpdate", () => {
  test("has expected string values", () => {
    expect(AdjacentUpdate.mimes).toBe("MIMES");
    expect(AdjacentUpdate.open).toBe("OPEN");
    expect(AdjacentUpdate.forceOpen).toBe("FORCE_OPEN");
  });

  test("has exactly 3 members", () => {
    const values = Object.values(AdjacentUpdate);
    expect(values).toHaveLength(3);
  });
});

describe("GridSize", () => {
  test("has expected numeric values", () => {
    expect(GridSize.XS).toBe(5);
    expect(GridSize.S).toBe(10);
    expect(GridSize.M).toBe(20);
    expect(GridSize.L).toBe(30);
    expect(GridSize.XL).toBe(40);
  });

  test("has exactly 5 members", () => {
    const values = Object.values(GridSize).filter((v) => typeof v === "number");
    expect(values).toHaveLength(5);
  });
});

describe("MimeSize", () => {
  test("has expected numeric values", () => {
    expect(MimeSize.XS).toBe(5);
    expect(MimeSize.S).toBe(10);
    expect(MimeSize.M).toBe(25);
    expect(MimeSize.L).toBe(50);
    expect(MimeSize.XL).toBe(100);
  });

  test("has exactly 5 members", () => {
    const values = Object.values(MimeSize).filter((v) => typeof v === "number");
    expect(values).toHaveLength(5);
  });
});
