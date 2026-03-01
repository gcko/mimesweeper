import { fireEvent, render, screen } from "@testing-library/react";
import type { Coordinate, EventType, GameSquare } from "types";
import Square from "./Square";

// Mock react-konva so Group renders as a <div> with real DOM events
vi.mock("react-konva", () => ({
  // biome-ignore lint/suspicious/noExplicitAny: test mock requires flexible typing
  Group: (props: any) => {
    const { onClick, onContextMenu, onDblClick, onTap, onDblTap, children } =
      props;
    return (
      // biome-ignore lint/a11y/useKeyWithClickEvents: test mock for Konva canvas events
      // biome-ignore lint/a11y/noStaticElementInteractions: test mock for Konva canvas events
      <div
        data-testid="konva-group"
        onClick={(e) => {
          if (onClick) {
            onClick({ evt: e.nativeEvent });
          }
        }}
        onContextMenu={(e) => {
          if (onContextMenu) {
            onContextMenu({ evt: e.nativeEvent });
          }
        }}
        onDoubleClick={(e) => {
          if (onDblClick) {
            onDblClick({ evt: e.nativeEvent });
          }
        }}
        onTouchEnd={() => {
          if (onTap) {
            onTap();
          }
        }}
        onTouchStart={() => {
          if (onDblTap) {
            onDblTap();
          }
        }}
      >
        {children}
      </div>
    );
  },
  // biome-ignore lint/suspicious/noExplicitAny: test mock requires flexible typing
  Rect: (props: any) => <div data-testid="konva-rect" data-fill={props.fill} />,
  // biome-ignore lint/suspicious/noExplicitAny: test mock requires flexible typing
  Text: (props: any) => <span data-testid="konva-text">{props.text}</span>,
  // biome-ignore lint/suspicious/noExplicitAny: test mock requires flexible typing
  Image: (props: any) => (
    <img data-testid="konva-image" alt="" src={props.image} />
  ),
  // biome-ignore lint/suspicious/noExplicitAny: test mock requires flexible typing
  Stage: (props: any) => <div>{props.children}</div>,
  // biome-ignore lint/suspicious/noExplicitAny: test mock requires flexible typing
  Layer: (props: any) => <div>{props.children}</div>,
}));

vi.mock("use-image", () => ({
  default: (src: string) => [src, "loaded"],
}));

type SquareTestProps = {
  size: number;
  coOrd: Coordinate;
  isGameOver: boolean;
  onSelect: (coOrd: Coordinate, type: EventType) => void;
  onRightClick: (coOrd: Coordinate, type: EventType) => void;
  onDoubleClick: (coOrd: Coordinate, type: EventType) => void;
} & GameSquare;

function renderSquare(overrides: Partial<SquareTestProps> = {}) {
  const defaultProps: SquareTestProps = {
    x: 0,
    y: 0,
    size: 25,
    coOrd: "0|0",
    onSelect: vi.fn(),
    onRightClick: vi.fn(),
    onDoubleClick: vi.fn(),
    mime: false,
    adjacentMimes: 0,
    opened: false,
    flagged: false,
    isGameOver: false,
  };
  const props = { ...defaultProps, ...overrides };
  return { ...render(<Square {...props} />), props };
}

describe("Square", () => {
  describe("rendering states", () => {
    test("renders unopened square without error", () => {
      expect(() => renderSquare()).not.toThrow();
    });

    test("renders opened square with adjacent count text", () => {
      renderSquare({ opened: true, adjacentMimes: 3 });
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    test("renders opened mine square", () => {
      expect(() => renderSquare({ opened: true, mime: true })).not.toThrow();
    });

    test("renders flagged square with flag image", () => {
      renderSquare({ flagged: true });
      const images = screen.getAllByTestId("konva-image");
      expect(images.length).toBeGreaterThanOrEqual(1);
    });

    test("renders game-over mine with image", () => {
      renderSquare({
        opened: true,
        mime: true,
        isGameOver: true,
      });
      const images = screen.getAllByTestId("konva-image");
      expect(images.length).toBeGreaterThanOrEqual(1);
    });

    test("renders empty text for unopened square", () => {
      renderSquare({ opened: false });
      const text = screen.getByTestId("konva-text");
      expect(text.textContent).toBe("");
    });

    test("renders with all adjacentMimes values", () => {
      const values: GameSquare["adjacentMimes"][] = [0, 1, 2, 3, 4, 5, 6, 7, 8];
      for (const adj of values) {
        expect(() =>
          renderSquare({ opened: true, adjacentMimes: adj }),
        ).not.toThrow();
      }
    });

    test("renders revealed mine (not clicked) with white fill and mime image", () => {
      renderSquare({
        opened: true,
        mime: true,
        isGameOver: true,
        clickedMime: false,
      });
      const rect = screen.getByTestId("konva-rect");
      expect(rect.dataset.fill).toBe("#FFFFFF");
      const images = screen.getAllByTestId("konva-image");
      expect(images.length).toBeGreaterThanOrEqual(1);
    });

    test("renders clicked mine with red fill", () => {
      renderSquare({
        opened: true,
        mime: true,
        isGameOver: true,
        clickedMime: true,
      });
      const rect = screen.getByTestId("konva-rect");
      expect(rect.dataset.fill).toBe("#f80000");
    });

    test("renders wrong flag with X text", () => {
      renderSquare({
        flagged: true,
        wrongFlag: true,
        isGameOver: true,
      });
      expect(screen.getByText("X")).toBeInTheDocument();
    });
  });

  describe("event handlers", () => {
    test("left click calls onSelect with correct args", () => {
      const onSelect = vi.fn();
      renderSquare({ onSelect, coOrd: "2|3" });
      const group = screen.getByTestId("konva-group");
      fireEvent.click(group, { button: 0 });
      expect(onSelect).toHaveBeenCalledWith("2|3", "click");
    });

    test("non-left click does not call onSelect", () => {
      const onSelect = vi.fn();
      renderSquare({ onSelect });
      const group = screen.getByTestId("konva-group");
      fireEvent.click(group, { button: 2 });
      expect(onSelect).not.toHaveBeenCalled();
    });

    test("double click calls onDoubleClick with correct args", () => {
      const onDoubleClick = vi.fn();
      renderSquare({ onDoubleClick, coOrd: "4|5" });
      const group = screen.getByTestId("konva-group");
      fireEvent.doubleClick(group, { button: 0 });
      expect(onDoubleClick).toHaveBeenCalledWith("4|5", "dblclick");
    });

    test("non-left double click does not call onDoubleClick", () => {
      const onDoubleClick = vi.fn();
      renderSquare({ onDoubleClick });
      const group = screen.getByTestId("konva-group");
      fireEvent.doubleClick(group, { button: 1 });
      expect(onDoubleClick).not.toHaveBeenCalled();
    });

    test("context menu calls onRightClick", () => {
      const onRightClick = vi.fn();
      renderSquare({ onRightClick, coOrd: "1|1" });
      const group = screen.getByTestId("konva-group");
      fireEvent.contextMenu(group);
      expect(onRightClick).toHaveBeenCalledWith("1|1", "contextmenu");
    });

    test("tap calls onSelect (touch)", () => {
      const onSelect = vi.fn();
      renderSquare({ onSelect, coOrd: "3|3" });
      const group = screen.getByTestId("konva-group");
      fireEvent.touchEnd(group);
      expect(onSelect).toHaveBeenCalledWith("3|3", "click");
    });

    test("double tap calls onDoubleClick (touch)", () => {
      const onDoubleClick = vi.fn();
      renderSquare({ onDoubleClick, coOrd: "5|5" });
      const group = screen.getByTestId("konva-group");
      fireEvent.touchStart(group);
      expect(onDoubleClick).toHaveBeenCalledWith("5|5", "dblclick");
    });
  });

  describe("color states", () => {
    test("opened clicked mine has red fill", () => {
      renderSquare({ opened: true, mime: true, clickedMime: true });
      const rect = screen.getByTestId("konva-rect");
      expect(rect.dataset.fill).toBe("#f80000");
    });

    test("unopened square has white fill", () => {
      renderSquare({ opened: false });
      const rect = screen.getByTestId("konva-rect");
      expect(rect.dataset.fill).toBe("#FFFFFF");
    });
  });

  describe("unmounting", () => {
    test("cleans up without error", () => {
      const { unmount } = renderSquare({ opened: true });
      expect(() => unmount()).not.toThrow();
    });
  });
});
