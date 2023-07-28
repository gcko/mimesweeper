// Types of updates that can be made to Adjacent Squares. Options include updating
//  adjacentMime values or opening the squares
export enum AdjacentUpdate {
  mimes = 'MIMES',
  open = 'OPEN',
  forceOpen = 'FORCE_OPEN'
}

// Number of Squares in the x & y direction of the play area
export enum GridSize {
  XS = 5,
  S = 10,
  M = 20,
  L = 30,
  XL = 40
}

// Number of Mimes to place in a play area
export enum MimeSize {
  XS = 5,
  S = 10,
  M = 25,
  L = 50,
  XL = 100
}
