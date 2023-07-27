import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders title', () => {
  render(<App />);
  const title = screen.getByText(/Mimesweeper/i);
  expect(title).toBeInTheDocument();
});

describe('Bottom Buttons', () => {
  test('has small game button', () => {
    render(<App />);
    const btnSmall = screen.getByText(/Small game/i);
    expect(btnSmall).toBeInTheDocument();
  });

  test('has medium game button', () => {
    render(<App />);
    const btnMedium = screen.getByText(/Medium game/i);
    expect(btnMedium).toBeInTheDocument();
  });

  test('has large game button', () => {
    render(<App />);
    const btnLarge = screen.getByText(/Large game/i);
    expect(btnLarge).toBeInTheDocument();
  });

  test('has an extra large game button', () => {
    render(<App />);
    const xlBtn = screen.getByText(/XL game/i);
    expect(xlBtn).toBeInTheDocument();
  });
});
