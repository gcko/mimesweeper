import "@testing-library/jest-dom/vitest";

// Mock HTMLCanvasElement.getContext for Konva canvas rendering
const getContextOriginal = HTMLCanvasElement.prototype.getContext;

HTMLCanvasElement.prototype.getContext = function (
  contextId: string,
  options?: unknown
) {
  if (contextId === "2d") {
    return {
      canvas: this,
      fillRect: () => {},
      clearRect: () => {},
      getImageData: (_x: number, _y: number, w: number, h: number) => ({
        data: new Array(w * h * 4)
      }),
      putImageData: () => {},
      createImageData: () => [],
      setTransform: () => {},
      drawImage: () => {},
      save: () => {},
      fillText: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      arc: () => {},
      fill: () => {},
      measureText: () => ({ width: 0 }),
      transform: () => {},
      rect: () => {},
      clip: () => {},
      createLinearGradient: () => ({
        addColorStop: () => {}
      }),
      createRadialGradient: () => ({
        addColorStop: () => {}
      }),
      createPattern: () => ({}),
      strokeRect: () => {},
      strokeText: () => {},
      bezierCurveTo: () => {},
      quadraticCurveTo: () => {},
      arcTo: () => {},
      isPointInPath: () => false,
      setLineDash: () => {},
      getLineDash: () => [],
      globalAlpha: 1,
      globalCompositeOperation: "source-over",
      fillStyle: "#000",
      strokeStyle: "#000",
      lineWidth: 1,
      lineCap: "butt",
      lineJoin: "miter",
      miterLimit: 10,
      shadowBlur: 0,
      shadowColor: "rgba(0, 0, 0, 0)",
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      font: "10px sans-serif",
      textAlign: "start",
      textBaseline: "alphabetic",
      imageSmoothingEnabled: true
    } as unknown as CanvasRenderingContext2D;
  }
  return getContextOriginal.call(
    this,
    contextId as "2d",
    options as CanvasRenderingContext2DSettings
  );
};
