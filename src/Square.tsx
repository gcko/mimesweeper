import React, { useEffect, useState } from 'react';
import { Group, Rect, Text } from 'react-konva';
import { GameSquare } from 'types';

type SquareProps = {
  x: number;
  y: number;
  size: number;
  coord: string;
  onSelect: (coord: string) => void;
};
const unopenedColor = '#FFFFFF';
const openedColor = '#22960F';
const mimeColor = '#f10606';
function Square({
  coord,
  x,
  y,
  size,
  onSelect,
  mime,
  opened,
  adjacentMimes,
}: SquareProps & GameSquare) {
  const [color, setColor] = useState(unopenedColor);
  const handleClick = () => {
    // TODO on click, if not a mime, need to bubble up to the parent in order to pass state changes to siblings
    //  https://dev.to/andydziabo/how-to-pass-data-between-sibling-components-in-react-2cjg
    // if this square hides a mime, game over :(
    onSelect(coord);
  };

  useEffect(() => {
    let newColor = unopenedColor;
    if (opened && mime) {
      newColor = mimeColor;
    } else if (opened) {
      newColor = openedColor;
    }
    setColor(() => newColor);
  }, [mime, opened]);

  return (
    <Group onClick={handleClick}>
      <Rect
        x={x}
        y={y}
        width={size}
        height={size}
        fill={color}
        shadowBlur={7}
        shadowColor="#000000"
      />
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
    </Group>
  );
}

export default Square;
