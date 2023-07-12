import React, { useEffect, useState } from 'react';
import { Group, Image, Rect, Text } from 'react-konva';
import { GameSquare } from 'types';
import Gradient from 'javascript-color-gradient';
import Konva from 'konva';
import KonvaEventObject = Konva.KonvaEventObject;

type SquareProps = {
  x: number;
  y: number;
  size: number;
  coOrd: string;
  onSelect: (coOrd: string, type: string) => void;
  onRightClick: (coOrd: string, type: string) => void;
  onDoubleClick: (coOrd: string, type: string) => void;
};
const unopenedColor = '#FFFFFF';
const openedColor = '#1bbb00';
const gradientEnd = '#ffea00';
const mimeColor = '#f80000';

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
  flag,
  gameOverMime,
  adjacentMimes,
}: SquareProps & GameSquare) {
  const [color, setColor] = useState(unopenedColor);
  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    // if this square hides a mime, game over :(
    // type = click
    onSelect(coOrd, e.type);
  };

  const handleDblClick = (e: KonvaEventObject<MouseEvent>) => {
    // type = dblclick
    // handler for a double click event
    onDoubleClick(coOrd, e.type);
  };

  const handleContextMenu = (e: KonvaEventObject<globalThis.PointerEvent>) => {
    // type = contextmenu
    onRightClick(coOrd, e.type);
  };

  const gradientArray = new Gradient()
    .setColorGradient(openedColor, gradientEnd)
    .setMidpoint(4)
    .getColors();

  useEffect(() => {
    let newColor = unopenedColor;
    if (opened && mime) {
      newColor = mimeColor;
    } else if (opened) {
      newColor = gradientArray[adjacentMimes];
    }
    setColor(() => newColor);
  }, [mime, opened, adjacentMimes, gradientArray]);

  return (
    <Group
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onDblClick={handleDblClick}
      onTap={handleClick}
      onDblTap={handleDblClick}
    >
      <Rect
        x={x}
        y={y}
        width={size}
        height={size}
        fill={color}
        shadowBlur={7}
        shadowColor="#000000"
      />
      {/* eslint-disable-next-line no-nested-ternary */}
      {flagged ? (
        <Image image={flag} height={size} width={size} x={x} y={y} />
      ) : opened && mime && isGameOver ? (
        <Image image={gameOverMime} height={size} width={size} x={x} y={y} />
      ) : (
        <Text
          x={x}
          y={y}
          width={size}
          height={size}
          padding={5}
          align="center"
          text={opened ? `${adjacentMimes}` : ``}
          fontFamily="Press Start 2P"
        />
      )}
    </Group>
  );
}

export default Square;
