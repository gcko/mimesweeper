import React, { useState } from 'react';
import { Group, Rect, Text } from 'react-konva';
import { GameSquare } from 'types';

type SquareProps = {
  x: number;
  y: number;
  size: number;
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Square({ x, y, size, mime, adjacentMimes }: SquareProps & GameSquare) {
  const [color, setColor] = useState('#FFFFFF');
  const [text, setText] = useState('');

  const handleClick = () => {
    // if this square hides a mime, game over :(
    if (mime) {
      setColor('#A10707');
      setText('X');
    } else {
      setColor('#22960F');
      setText('1');
    }
  };

  return (
    <Group onMouseLeave={handleClick}>
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
        text={text}
        fontFamily="Press Start 2P"
      />
    </Group>
  );
}

export default Square;
