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
  coord: string;
  onSelect: (coord: string, e: MouseEvent) => void;
  onRightClick: (coord: string, e: PointerEvent) => void;
};
const unopenedColor = '#FFFFFF';
const openedColor = '#1bbb00';
const gradientEnd = '#ffea00';
const mimeColor = '#f80000';

function Square({
  coord,
  x,
  y,
  size,
  onSelect,
  onRightClick,
  mime,
  opened,
  flagged,
  flag,
  adjacentMimes,
}: SquareProps & GameSquare) {
  const [color, setColor] = useState(unopenedColor);
  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    // if this square hides a mime, game over :(
    onSelect(coord, e.evt);
  };

  const handleContextMenu = (e: KonvaEventObject<globalThis.PointerEvent>) => {
    // type == contextmenu
    onRightClick(coord, e.evt);
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
    <Group onClick={handleClick} onContextMenu={handleContextMenu}>
      <Rect
        x={x}
        y={y}
        width={size}
        height={size}
        fill={color}
        shadowBlur={7}
        shadowColor="#000000"
      />
      {flagged ? (
        <Image image={flag} height={size} width={size} x={x} y={y} />
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
