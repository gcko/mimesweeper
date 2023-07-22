import React, { useEffect, useState } from 'react';
import { Group, Image, Rect, Text } from 'react-konva';
import Gradient from 'javascript-color-gradient';
import useImage from 'use-image';
import Konva from 'konva';
import { Coordinate, EventType, GameSquare } from 'types';
import flagImage from 'images/stop.png';
import gameOverImage from 'images/mime_color.png';
import KonvaEventObject = Konva.KonvaEventObject;

type SquareProps = {
  x: number;
  y: number;
  size: number;
  coOrd: Coordinate;
  onSelect: (coOrd: Coordinate, type: EventType) => void;
  onRightClick: (coOrd: Coordinate, type: EventType) => void;
  onDoubleClick: (coOrd: Coordinate, type: EventType) => void;
};

// Capture all the colors and magic number settings in Square
const unopenedColor = '#FFFFFF';
const openedColor = '#1bbb00';
const gradientEnd = '#ffea00';
const mimeColor = '#f80000';
const shadowColor = '#000000';
const shadowBlurSize = 7;
const textPadding = 5;
const gradientMidpoint = 4;

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
  adjacentMimes
}: SquareProps & GameSquare) {
  const [color, setColor] = useState(unopenedColor);

  const [flagImg] = useImage(flagImage, undefined, 'same-origin');
  const [gameOverMime] = useImage(gameOverImage, undefined, 'same-origin');

  // Handler for the left-click Mouse event
  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    // if this square hides a mime, game over :(
    if (e.evt.button === 0) {
      // Only fire if this is a main button mouse click
      onSelect(coOrd, 'click');
    }
    e.evt.preventDefault();
  };

  // Handler for a double click event
  const handleDblClick = (e: KonvaEventObject<MouseEvent>) => {
    if (e.evt.button === 0) {
      // Only fire if this is the main button mouse double click
      onDoubleClick(coOrd, 'dblclick');
    }
  };

  // Handler for the right-click event
  const handleContextMenu = (e: KonvaEventObject<PointerEvent>) => {
    onRightClick(coOrd, 'contextmenu');
    e.evt.preventDefault();
  };

  const gradientArray = new Gradient()
    .setColorGradient(openedColor, gradientEnd)
    .setMidpoint(gradientMidpoint)
    .getColors();

  useEffect(() => {
    let newColor = unopenedColor;
    if (opened && mime) {
      newColor = mimeColor;
    } else if (opened) {
      newColor = gradientArray[adjacentMimes];
    }
    setColor(() => newColor);
    return function cleanup() {
      newColor = unopenedColor;
    };
  }, [mime, opened, adjacentMimes]);

  return (
    <Group
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onDblClick={handleDblClick}
      onTap={() => onSelect(coOrd, 'click')}
      onDblTap={() => onDoubleClick(coOrd, 'dblclick')}
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
      {/* eslint-disable-next-line no-nested-ternary */}
      {flagged ? (
        <Image image={flagImg} height={size} width={size} x={x} y={y} />
      ) : (
        ''
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
          text={opened ? `${adjacentMimes}` : ``}
          fontFamily="Press Start 2P"
        />
      )}
    </Group>
  );
}

export default Square;
