import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders title', () => {
  render(<App />);
  const title = screen.getByText(/Mimesweeper/i);
  expect(title).toBeInTheDocument();
});

describe('Stage', () => {
  test('Clicking Small Game button starts a small game', () => {
    render(<App />);
    const stage = screen.getByTestId('stage');
    // test the default size is the same as squareSize * GridSize.L
    expect(stage).toHaveAttribute('width', 25 * 30);
  });
});

describe('Bottom Buttons', () => {
  test('has small game button', () => {
    render(<App />);
    const buttonSmall = screen.getByText(/small game/i);
    expect(buttonSmall).toBeInTheDocument();
  });

  test('Clicking Small Game button starts a small game', () => {
    render(<App />);
    const stage = screen.getByTestId('stage');
    const buttonSmall = screen.getByText(/small game/i);
    // click the button
    buttonSmall.click();
    // test the UI changed
    expect(stage).toHaveAttribute('width', 25 * 10);
  });
});
