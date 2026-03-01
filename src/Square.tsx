import Gradient from "javascript-color-gradient";
import type Konva from "konva";
import { useCallback, useMemo, useRef } from "react";
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
  isGameOver: boolean;
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
const LONG_PRESS_DURATION = 500;
const MOVE_THRESHOLD = 10;

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
  clickedMime,
  wrongFlag,
}: SquareProps & GameSquare) {
  const [flagImg] = useImage(flagImage, undefined, "same-origin");
  const [gameOverMime] = useImage(gameOverImage, undefined, "same-origin");

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const longPressTriggered = useRef(false);

  const color = useMemo(() => {
    if (opened && mime && clickedMime) {
      return mimeColor;
    }
    if (opened && mime) {
      return unopenedColor;
    }
    if (opened) {
      return gradientArray[adjacentMimes];
    }
    return unopenedColor;
  }, [opened, mime, adjacentMimes, clickedMime]);

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
    if (longPressTriggered.current) return;
    onSelect(coOrd, "click");
  }, [coOrd, onSelect]);

  const handleDblTap = useCallback(() => {
    onDoubleClick(coOrd, "dblclick");
  }, [coOrd, onDoubleClick]);

  const handleTouchStart = useCallback(
    (e: KonvaEventObject<TouchEvent>) => {
      const touch = e.evt.touches[0];
      if (!touch) return;
      touchStartPos.current = { x: touch.clientX, y: touch.clientY };
      longPressTriggered.current = false;

      longPressTimer.current = setTimeout(() => {
        longPressTriggered.current = true;
        onRightClick(coOrd, "contextmenu");
      }, LONG_PRESS_DURATION);
    },
    [coOrd, onRightClick],
  );

  const handleTouchMove = useCallback((e: KonvaEventObject<TouchEvent>) => {
    if (!touchStartPos.current || !longPressTimer.current) return;
    const touch = e.evt.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPos.current.x);
    const dy = Math.abs(touch.clientY - touchStartPos.current.y);
    if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  return (
    <Group
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onDblClick={handleDblClick}
      onTap={handleTap}
      onDblTap={handleDblTap}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
      {wrongFlag && isGameOver ? (
        <Text
          x={x}
          y={y}
          width={size}
          height={size}
          padding={textPadding}
          align="center"
          verticalAlign="middle"
          text="X"
          fontFamily="Press Start 2P"
          fill="#f80000"
          fontSize={14}
        />
      ) : opened && mime && isGameOver ? (
        <Image image={gameOverMime} height={size} width={size} x={x} y={y} />
      ) : (
        <Text
          x={x}
          y={y}
          width={size}
          height={size}
          padding={textPadding}
          align="center"
          verticalAlign="middle"
          text={opened ? String(adjacentMimes) : ``}
          fontFamily="Press Start 2P"
        />
      )}
    </Group>
  );
}

export default Square;
