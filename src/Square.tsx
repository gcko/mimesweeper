import Gradient from "javascript-color-gradient";
import type Konva from "konva";
import { useCallback, useMemo } from "react";
import { Group, Image, Rect, Text } from "react-konva";
import type { Coordinate, EventType, GameSquare } from "types";
import useImage from "use-image";

type KonvaEventObject<T> = Konva.KonvaEventObject<T>;

import gameOverImage from "./images/mime_color.png";
import flagImage from "./images/stop.png";

interface SquareProps {
  x: number;
  y: number;
  size: number;
  coOrd: Coordinate;
  onSelect: (coOrd: Coordinate, type: EventType) => void;
  onRightClick: (coOrd: Coordinate, type: EventType) => void;
  onDoubleClick: (coOrd: Coordinate, type: EventType) => void;
}

// Capture all the colors and magic number settings in Square
const unopenedColor = "#FFFFFF";
const openedColor = "#1bbb00";
const gradientEnd = "#ffea00";
const mimeColor = "#f80000";
const shadowColor = "#000000";
const shadowBlurSize = 7;
const textPadding = 5;
const gradientMidpoint = 4;

// Hoisted to module scope — inputs are constants, no need to recompute
const gradientArray = new Gradient()
  .setColorGradient(openedColor, gradientEnd)
  .setMidpoint(gradientMidpoint)
  .getColors();

function Square({
  coOrd,
  x,
  y,
  size,
  onSelect,
  onRightClick,
  onDoubleClick,
  mime,
  opened,
  flagged,
  isGameOver,
  adjacentMimes,
}: SquareProps & GameSquare) {
  const [flagImg] = useImage(flagImage, undefined, "same-origin");
  const [gameOverMime] = useImage(gameOverImage, undefined, "same-origin");

  const color = useMemo(() => {
    if (opened && mime) {
      return mimeColor;
    }
    if (opened) {
      return gradientArray[adjacentMimes];
    }
    return unopenedColor;
  }, [opened, mime, adjacentMimes]);

  const handleClick = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (e.evt.button === 0) {
        onSelect(coOrd, "click");
      }
      e.evt.preventDefault();
    },
    [coOrd, onSelect],
  );

  const handleDblClick = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (e.evt.button === 0) {
        onDoubleClick(coOrd, "dblclick");
      }
    },
    [coOrd, onDoubleClick],
  );

  const handleContextMenu = useCallback(
    (e: KonvaEventObject<PointerEvent>) => {
      onRightClick(coOrd, "contextmenu");
      e.evt.preventDefault();
    },
    [coOrd, onRightClick],
  );

  const handleTap = useCallback(() => {
    onSelect(coOrd, "click");
  }, [coOrd, onSelect]);

  const handleDblTap = useCallback(() => {
    onDoubleClick(coOrd, "dblclick");
  }, [coOrd, onDoubleClick]);

  return (
    <Group
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onDblClick={handleDblClick}
      onTap={handleTap}
      onDblTap={handleDblTap}
    >
      <Rect
        x={x}
        y={y}
        width={size}
        height={size}
        fill={color}
        shadowBlur={shadowBlurSize}
        shadowColor={shadowColor}
      />
      {flagged && flagImg && (
        <Image image={flagImg} height={size} width={size} x={x} y={y} />
      )}
      {opened && mime && isGameOver ? (
        <Image image={gameOverMime} height={size} width={size} x={x} y={y} />
      ) : (
        <Text
          x={x}
          y={y}
          width={size}
          height={size}
          padding={textPadding}
          align="center"
          text={opened ? String(adjacentMimes) : ``}
          fontFamily="Press Start 2P"
        />
      )}
    </Group>
  );
}

export default Square;
