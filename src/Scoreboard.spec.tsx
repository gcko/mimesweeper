import { fireEvent, render, screen } from "@testing-library/react";
import type { DifficultyKey, ScoreEntry } from "types.d";
import Scoreboard from "./Scoreboard";

function createMockScores(): Record<DifficultyKey, ScoreEntry[]> {
  return {
    S: [
      { name: "AAA", score: 900 },
      { name: "BBB", score: 800 },
    ],
    M: [{ name: "CCC", score: 5000 }],
    L: [],
    XL: [{ name: "DDD", score: 15000 }],
  };
}

describe("Scoreboard", () => {
  test("renders heading", () => {
    const scores = createMockScores();
    render(<Scoreboard getScores={(d) => scores[d]} onClose={vi.fn()} />);
    expect(screen.getByText("Top 10 Scores")).toBeInTheDocument();
  });

  test("shows Small scores by default", () => {
    const scores = createMockScores();
    render(<Scoreboard getScores={(d) => scores[d]} onClose={vi.fn()} />);
    expect(screen.getByText("AAA")).toBeInTheDocument();
    expect(screen.getByText("900")).toBeInTheDocument();
  });

  test("switches to Medium scores on tab click", () => {
    const scores = createMockScores();
    render(<Scoreboard getScores={(d) => scores[d]} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("Medium"));
    expect(screen.getByText("CCC")).toBeInTheDocument();
    expect(screen.getByText("5000")).toBeInTheDocument();
  });

  test("calls onClose when Close button is clicked", () => {
    const scores = createMockScores();
    const onClose = vi.fn();
    render(<Scoreboard getScores={(d) => scores[d]} onClose={onClose} />);
    fireEvent.click(screen.getByText("Close"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  test("renders all four difficulty tabs", () => {
    const scores = createMockScores();
    render(<Scoreboard getScores={(d) => scores[d]} onClose={vi.fn()} />);
    expect(screen.getByText("Small")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(screen.getByText("Large")).toBeInTheDocument();
    expect(screen.getByText("XL")).toBeInTheDocument();
  });
});
