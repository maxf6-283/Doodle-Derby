import { Accessor, Setter } from "solid-js";
import { CanvasButton } from "./CanvasButton";
import { PaintCanvas, PaintMode } from "../../api/draw/painting";

export interface ArtistBarProps {
  brush: Accessor<{ color: string; strokeWidth: number }>;
  setBrush: Setter<{ color: string; strokeWidth: number }>;
  paintMode: Accessor<PaintMode>;
  setPaintMode: Setter<PaintMode>;
  paintCanvas: PaintCanvas | undefined;
}
export function ArtistBar(props: ArtistBarProps) {
  const SMALL_BRUSH_SIZE = 5;
  const MEDIUM_BRUSH_SIZE = 10;
  const LARGE_BRUSH_SIZE = 20;
  const EXTREME_BRUSH_SIZE = 30;

  const setBrushStroke = (stroke: number) => {
    props.setBrush((prev) => ({ ...prev, strokeWidth: stroke }));
  };

  const changeColor = (color: string) => {
    props.setBrush((prev) => ({ ...prev, color }));
  };

  return (
    <div class="sidebar" id="sidebar">
      {/* Brush Sizes */}
      <div class="sidebar-options-container">
        <CanvasButton
          icon="/drawing/small_brush.png"
          alt="Small"
          isActive={props.brush().strokeWidth === SMALL_BRUSH_SIZE}
          onClick={() => setBrushStroke(SMALL_BRUSH_SIZE)}
          size="96px"
          top="60%"
          left="55%"
        />
        <CanvasButton
          icon="/drawing/medium_brush.png"
          alt="Medium"
          isActive={props.brush().strokeWidth === MEDIUM_BRUSH_SIZE}
          onClick={() => setBrushStroke(MEDIUM_BRUSH_SIZE)}
          size="96px"
          top="60%"
          left="55%"
        />
        <CanvasButton
          icon="/drawing/large_brush.png"
          alt="Large"
          isActive={props.brush().strokeWidth === LARGE_BRUSH_SIZE}
          onClick={() => setBrushStroke(LARGE_BRUSH_SIZE)}
          size="96px"
          top="60%"
          left="55%"
        />
        <CanvasButton
          icon="/drawing/extreme_brush.png"
          alt="Extreme"
          isActive={props.brush().strokeWidth === EXTREME_BRUSH_SIZE}
          onClick={() => setBrushStroke(EXTREME_BRUSH_SIZE)}
          size="96px"
          top="60%"
          left="55%"
        />
      </div>

      {/* Modes */}
      <div class="sidebar-options-container">
        <CanvasButton
          icon="/drawing/paintbrush.png"
          alt="Fill"
          isActive={props.paintMode() === PaintMode.DRAW}
          onClick={() => props.setPaintMode(PaintMode.DRAW)}
          top="50%"
          left="50%"
        />
        <CanvasButton
          icon="/drawing/eraser.png"
          alt="Erase"
          isActive={props.paintMode() === PaintMode.ERASE}
          onClick={() => props.setPaintMode(PaintMode.ERASE)}
          top="50%"
          left="50%"
        />
        <CanvasButton
          icon="/drawing/bucket.png"
          alt="Fill"
          isActive={props.paintMode() === PaintMode.FILL}
          onClick={() => props.setPaintMode(PaintMode.FILL)}
          top="50%"
          left="50%"
          size="40px"
        />
      </div>

      {/* Actions (Non-toggle) */}
      <div class="sidebar-options-container">
        <CanvasButton
          icon="/drawing/undo_icon.png"
          alt="Undo"
          isActive={false}
          onClick={() => props.paintCanvas?.undo()}
          size="64px"
          top="50%"
          left="50%"
          transparent={true}
        />
        <CanvasButton
          icon="/drawing/redo_button.png"
          alt="Redo"
          isActive={false}
          onClick={() => props.paintCanvas?.redo()}
          size="64px"
          top="50%"
          left="50%"
          transparent={true}
        />
      </div>

      <input
        type="color"
        style={{ width: "100%", height: "40px", "margin-top": "5px" }}
        onInput={(element) => changeColor(element.currentTarget.value)}
      />
    </div>
  );
}
