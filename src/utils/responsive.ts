export const MIN_SQUARE_SIZE = 28;
export const MAX_SQUARE_SIZE = 40;
const CONTAINER_PADDING = 32; // 16px each side
const MAX_BOARD_WIDTH = 1200;

export function computeSquareSide(
  viewportWidth: number,
  gridSize: number,
): number {
  const available = Math.min(
    Math.max(0, viewportWidth - CONTAINER_PADDING),
    MAX_BOARD_WIDTH,
  );
  const computed = Math.floor(available / gridSize);
  return Math.max(MIN_SQUARE_SIZE, Math.min(MAX_SQUARE_SIZE, computed));
}
