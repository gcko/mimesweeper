import { act, fireEvent, render, screen } from "@testing-library/react";
import type { Coordinate, GameSquare } from "types.d";
import App from "./App";
import * as gameLogic from "./utils/gameLogic.ts";

// Mock react-konva so canvas elements render as DOM elements
vi.mock("react-konva", () => ({
  // biome-ignore lint/suspicious/noExplicitAny: test mock
  Stage: (props: any) => <div data-testid="stage">{props.children}</div>,
  // biome-ignore lint/suspicious/noExplicitAny: test mock
  Layer: (props: any) => <div>{props.children}</div>,
}));

// Mock Square to render a button we can click
vi.mock("./Square", () => ({
  // biome-ignore lint/suspicious/noExplicitAny: test mock
  default: (props: any) => (
    <button
      type="button"
      data-testid={`square-${props.coOrd}`}
      onClick={() => props.onSelect(props.coOrd, "click")}
      onContextMenu={(e) => {
        e.preventDefault();
        props.onRightClick(props.coOrd, "contextmenu");
      }}
      onDoubleClick={() => props.onDoubleClick(props.coOrd, "dblclick")}
    >
      {props.coOrd}
    </button>
  ),
}));

vi.mock("use-image", () => ({
  default: () => [null, "loaded"],
}));

describe("App", () => {
  describe("initial rendering", () => {
    test("renders title", () => {
      render(<App />);
      expect(screen.getByText(/Mimesweeper/i)).toBeInTheDocument();
    });

    test("renders How to play button", () => {
      render(<App />);
      expect(screen.getByText(/How to play/i)).toBeInTheDocument();
    });

    test("renders play time display", () => {
      render(<App />);
      expect(screen.getByText(/Play time: 0s/i)).toBeInTheDocument();
    });

    test("renders flags remaining display", () => {
      render(<App />);
      expect(screen.getByText(/Flags Remaining: 10/i)).toBeInTheDocument();
    });

    test("renders Restart section", () => {
      render(<App />);
      expect(screen.getByText(/Restart\?/i)).toBeInTheDocument();
    });
  });

  describe("difficulty buttons", () => {
    test("has small game button", () => {
      render(<App />);
      const buttons = screen.getAllByText(/Small game/i);
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });

    test("has medium game button", () => {
      render(<App />);
      const buttons = screen.getAllByText(/Medium game/i);
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });

    test("has large game button", () => {
      render(<App />);
      const buttons = screen.getAllByText(/Large game/i);
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });

    test("has an extra large game button", () => {
      render(<App />);
      const buttons = screen.getAllByText(/XL game/i);
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("rules overlay", () => {
    test("shows rules when How to play is clicked", () => {
      render(<App />);
      const howToPlayBtn = screen.getByText(/How to play/i);
      act(() => {
        howToPlayBtn.click();
      });
      expect(screen.getByText("How to Play")).toBeInTheDocument();
      expect(
        screen.getByText(/Left click to open a space/i),
      ).toBeInTheDocument();
    });

    test("dismisses rules when Let's play button is clicked", () => {
      render(<App />);
      act(() => {
        screen.getByText(/How to play/i).click();
      });
      act(() => {
        screen.getByText(/Let's play!/i).click();
      });
      expect(
        screen.queryByText(/Left click to open a space/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("restart buttons", () => {
    test("clicking small game shows correct flags", () => {
      render(<App />);
      const buttons = screen.getAllByText(/Small game/i);
      act(() => {
        buttons[buttons.length - 1].click();
      });
      expect(screen.getByText(/Flags Remaining: 10/i)).toBeInTheDocument();
    });

    test("clicking medium game changes flag count", () => {
      render(<App />);
      const buttons = screen.getAllByText(/Medium game/i);
      act(() => {
        buttons[buttons.length - 1].click();
      });
      expect(screen.getByText(/Flags Remaining: 25/i)).toBeInTheDocument();
    });

    test("clicking large game changes flag count", () => {
      render(<App />);
      const buttons = screen.getAllByText(/Large game/i);
      act(() => {
        buttons[buttons.length - 1].click();
      });
      expect(screen.getByText(/Flags Remaining: 50/i)).toBeInTheDocument();
    });

    test("clicking XL game changes flag count", () => {
      render(<App />);
      const buttons = screen.getAllByText(/XL game/i);
      act(() => {
        buttons[buttons.length - 1].click();
      });
      expect(screen.getByText(/Flags Remaining: 100/i)).toBeInTheDocument();
    });

    test("resets play time on restart", () => {
      render(<App />);
      const buttons = screen.getAllByText(/Small game/i);
      act(() => {
        buttons[buttons.length - 1].click();
      });
      expect(screen.getByText(/Play time: 0s/i)).toBeInTheDocument();
    });
  });

  describe("game flow — handleSquareSelect", () => {
    test("first click populates mimes and starts game", () => {
      const populateSpy = vi.spyOn(gameLogic, "populateMimes");
      const clickSpy = vi
        .spyOn(gameLogic, "processSquareClick")
        .mockReturnValue({
          openedCount: 1,
          lost: false,
        });

      render(<App />);
      const square = screen.getByTestId("square-0|0");

      act(() => {
        fireEvent.click(square);
      });

      expect(populateSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();

      populateSpy.mockRestore();
      clickSpy.mockRestore();
    });

    test("left click on mine triggers game over lost", () => {
      vi.spyOn(gameLogic, "populateMimes").mockImplementation(
        (entries) => new Map<Coordinate, GameSquare>(entries),
      );
      vi.spyOn(gameLogic, "processSquareClick").mockReturnValue({
        openedCount: 0,
        lost: true,
      });

      render(<App />);
      const square = screen.getByTestId("square-0|0");

      act(() => {
        fireEvent.click(square);
      });

      expect(screen.getByText(/GAME OVER!/i)).toBeInTheDocument();
      expect(screen.getByText(/You Lost/i)).toBeInTheDocument();

      vi.restoreAllMocks();
    });

    test("right click toggles flag and decrements flag count", () => {
      // First click to start the game
      vi.spyOn(gameLogic, "populateMimes").mockImplementation(
        (entries) => new Map<Coordinate, GameSquare>(entries),
      );
      vi.spyOn(gameLogic, "processSquareClick").mockReturnValue({
        openedCount: 1,
        lost: false,
      });

      render(<App />);

      // First left click to start game
      act(() => {
        fireEvent.click(screen.getByTestId("square-0|0"));
      });

      vi.restoreAllMocks();

      // Now right click to flag
      vi.spyOn(gameLogic, "processRightClick").mockReturnValue(-1);

      act(() => {
        fireEvent.contextMenu(screen.getByTestId("square-1|1"));
      });

      expect(screen.getByText(/Flags Remaining: 9/i)).toBeInTheDocument();

      vi.restoreAllMocks();
    });

    test("right click unflag increments flag count", () => {
      vi.spyOn(gameLogic, "populateMimes").mockImplementation(
        (entries) => new Map<Coordinate, GameSquare>(entries),
      );
      vi.spyOn(gameLogic, "processSquareClick").mockReturnValue({
        openedCount: 1,
        lost: false,
      });

      render(<App />);

      // Start game
      act(() => {
        fireEvent.click(screen.getByTestId("square-0|0"));
      });

      vi.restoreAllMocks();

      // Flag then unflag
      vi.spyOn(gameLogic, "processRightClick")
        .mockReturnValueOnce(-1)
        .mockReturnValueOnce(1);

      act(() => {
        fireEvent.contextMenu(screen.getByTestId("square-1|1"));
      });
      act(() => {
        fireEvent.contextMenu(screen.getByTestId("square-1|1"));
      });

      expect(screen.getByText(/Flags Remaining: 10/i)).toBeInTheDocument();

      vi.restoreAllMocks();
    });

    test("double click triggers processDoubleClick", () => {
      vi.spyOn(gameLogic, "populateMimes").mockImplementation(
        (entries) => new Map<Coordinate, GameSquare>(entries),
      );
      vi.spyOn(gameLogic, "processSquareClick").mockReturnValue({
        openedCount: 1,
        lost: false,
      });

      render(<App />);

      // Start game with left click
      act(() => {
        fireEvent.click(screen.getByTestId("square-0|0"));
      });

      vi.restoreAllMocks();

      const dblClickSpy = vi
        .spyOn(gameLogic, "processDoubleClick")
        .mockReturnValue({
          openedCount: 2,
          lost: false,
        });

      act(() => {
        fireEvent.doubleClick(screen.getByTestId("square-0|0"));
      });

      expect(dblClickSpy).toHaveBeenCalled();

      vi.restoreAllMocks();
    });

    test("double click on mine causes game over", () => {
      vi.spyOn(gameLogic, "populateMimes").mockImplementation(
        (entries) => new Map<Coordinate, GameSquare>(entries),
      );
      vi.spyOn(gameLogic, "processSquareClick").mockReturnValue({
        openedCount: 1,
        lost: false,
      });

      render(<App />);

      act(() => {
        fireEvent.click(screen.getByTestId("square-0|0"));
      });

      vi.restoreAllMocks();

      vi.spyOn(gameLogic, "processDoubleClick").mockReturnValue({
        openedCount: 0,
        lost: true,
      });

      act(() => {
        fireEvent.doubleClick(screen.getByTestId("square-0|0"));
      });

      expect(screen.getByText(/GAME OVER!/i)).toBeInTheDocument();
      expect(screen.getByText(/You Lost/i)).toBeInTheDocument();

      vi.restoreAllMocks();
    });

    test("winning the game shows game over won", () => {
      vi.spyOn(gameLogic, "populateMimes").mockImplementation(
        (entries) => new Map<Coordinate, GameSquare>(entries),
      );
      // Return enough opened squares to win (boardSize=10, mimes=10, need 90 opens)
      vi.spyOn(gameLogic, "processSquareClick").mockReturnValue({
        openedCount: 90,
        lost: false,
      });
      vi.spyOn(gameLogic, "isWin").mockReturnValue(true);

      render(<App />);

      act(() => {
        fireEvent.click(screen.getByTestId("square-0|0"));
      });

      expect(screen.getByText(/GAME OVER!/i)).toBeInTheDocument();
      expect(screen.getByText(/You Won/i)).toBeInTheDocument();

      vi.restoreAllMocks();
    });

    test("right click with 0 delta does not change flag count", () => {
      vi.spyOn(gameLogic, "populateMimes").mockImplementation(
        (entries) => new Map<Coordinate, GameSquare>(entries),
      );
      vi.spyOn(gameLogic, "processSquareClick").mockReturnValue({
        openedCount: 1,
        lost: false,
      });

      render(<App />);

      act(() => {
        fireEvent.click(screen.getByTestId("square-0|0"));
      });

      vi.restoreAllMocks();

      // processRightClick returns 0 (no-op, e.g. on opened square)
      vi.spyOn(gameLogic, "processRightClick").mockReturnValue(0);

      act(() => {
        fireEvent.contextMenu(screen.getByTestId("square-0|0"));
      });

      expect(screen.getByText(/Flags Remaining: 10/i)).toBeInTheDocument();

      vi.restoreAllMocks();
    });
  });

  describe("game over overlay", () => {
    function triggerGameOver() {
      vi.spyOn(gameLogic, "populateMimes").mockImplementation(
        (entries) => new Map<Coordinate, GameSquare>(entries),
      );
      vi.spyOn(gameLogic, "processSquareClick").mockReturnValue({
        openedCount: 0,
        lost: true,
      });
    }

    afterEach(() => {
      vi.restoreAllMocks();
    });

    test("game over overlay has all restart buttons", () => {
      triggerGameOver();
      render(<App />);
      act(() => {
        fireEvent.click(screen.getByTestId("square-0|0"));
      });

      expect(screen.getByText(/GAME OVER!/i)).toBeInTheDocument();
      // Overlay has its own set of buttons, plus the bottom set
      const smallBtns = screen.getAllByText(/Small game/i);
      expect(smallBtns.length).toBe(2);
    });

    test("game over small restart resets game", () => {
      triggerGameOver();
      render(<App />);
      act(() => {
        fireEvent.click(screen.getByTestId("square-0|0"));
      });

      vi.restoreAllMocks();

      // Click the overlay's Small game button (first one)
      const smallBtns = screen.getAllByText(/Small game/i);
      act(() => {
        smallBtns[0].click();
      });

      expect(screen.queryByText(/GAME OVER!/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Flags Remaining: 10/i)).toBeInTheDocument();
    });

    test("game over medium restart resets game", () => {
      triggerGameOver();
      render(<App />);
      act(() => {
        fireEvent.click(screen.getByTestId("square-0|0"));
      });

      vi.restoreAllMocks();

      const medBtns = screen.getAllByText(/Medium game/i);
      act(() => {
        medBtns[0].click();
      });

      expect(screen.queryByText(/GAME OVER!/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Flags Remaining: 25/i)).toBeInTheDocument();
    });

    test("game over large restart resets game", () => {
      triggerGameOver();
      render(<App />);
      act(() => {
        fireEvent.click(screen.getByTestId("square-0|0"));
      });

      vi.restoreAllMocks();

      const lgBtns = screen.getAllByText(/Large game/i);
      act(() => {
        lgBtns[0].click();
      });

      expect(screen.queryByText(/GAME OVER!/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Flags Remaining: 50/i)).toBeInTheDocument();
    });

    test("game over XL restart resets game", () => {
      triggerGameOver();
      render(<App />);
      act(() => {
        fireEvent.click(screen.getByTestId("square-0|0"));
      });

      vi.restoreAllMocks();

      const xlBtns = screen.getAllByText(/XL game/i);
      act(() => {
        xlBtns[0].click();
      });

      expect(screen.queryByText(/GAME OVER!/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Flags Remaining: 100/i)).toBeInTheDocument();
    });
  });
});
