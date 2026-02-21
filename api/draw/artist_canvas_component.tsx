import 'solid-js/web';

import konva from "konva";
import { onCleanup, createSignal, onMount } from 'solid-js';

import { PaintCanvas } from './painting';

import { RPC } from 'playroomkit';

const SMALL_BRUSH_SIZE = 5;
const MEDIUM_BRUSH_SIZE = 20;
const LARGE_BRUSH_SIZE = 30;

const DEFAULT_BRUSH = { color: "#000000", strokeWidth: 5 };

function DrawCanvas(props: { prompt: string }) {
  let stage: konva.Stage;
  let canvasRef: HTMLCanvasElement | undefined;
  let containerRef: HTMLDivElement | undefined;

  let [width] = createSignal(600);
  let [height] = createSignal(600);

  let [paintMode, setPaintMode] = createSignal(PaintMode.DRAW);
  let [brush, setBrush] = createSignal(DEFAULT_BRUSH);

  let [paintCanvas, setPaintCanvas] = createSignal<PaintCanvas>();

  const setModePaint = () => {
    setPaintMode(PaintMode.DRAW);
  }

  const setModeErase = () => {
    if (paintMode() == PaintMode.ERASE) {
      setModePaint();
    } else {
      setPaintMode(PaintMode.ERASE);
    }

    let paint = paintCanvas();
    if (paint == undefined) {
      console.warn("Paint canvas is not initialized yet");
      return;
    }

    paint.setErasing(!paint.isErasing);
    setPaintCanvas(paint);
  }

  const setModeFill = () => {
    if (paintMode() == PaintMode.FILL) {
      setModePaint();
      return;
    }

    setPaintMode(PaintMode.FILL);
  }

  const setBrushStroke = (stroke: number) => {
    setPaintCanvas(prevCanvas => {
      prevCanvas?.setBrushStrokeWidth(stroke);
      return prevCanvas;
    });
  }

  const changeColor = (color: string) => {
    setPaintCanvas(prevCanvas => {
      prevCanvas?.setBrushColor(color);
      return prevCanvas;
    });
  }

  onMount(() => {
    if (canvasRef == undefined || containerRef == undefined) {
      console.error("Canvas or container reference is undefined");
      return;
    }

    stage = new konva.Stage({
      container: containerRef,
      width: width(),
      height: height()
    });

    setPaintCanvas(() =>
      new PaintCanvas(
        canvasRef,
        { x: 0, y: 0 },
        stage,
        DEFAULT_BRUSH
      )
    );

    let intervalId = setInterval(() => {
      const url = canvasRef.toDataURL();
      RPC.call("canvasChange", { data: url }, RPC.Mode.OTHERS);
    }, 300);

    onCleanup(() => {
      stage.destroy();
      clearInterval(intervalId);
    });

    window.addEventListener("keydown", ev => {
      let paint = paintCanvas();

      if (paint == undefined) {
        console.warn("Paint canvas is not initialized yet");
        return;
      }

      if (ev.key == "e") {
        paint.setErasing(!paint.isErasing);
      }

      if (ev.key == "u") {
        paint.undo();
      }

      if (ev.key == "r") {
        paint.redo();
      }

      if (ev.key == "f") {
        let x = stage.pointerPos?.x as number;
        let y = stage.pointerPos?.y as number;
        paint.fill(Math.floor(x), Math.floor(y), paint.brushColor);
      }

      setPaintCanvas(paint);
    });
  });

  return (
    <>
      <h1 style={{ position: "fixed", right: "200px" }}>
        {props.prompt.toUpperCase()}
      </h1>

      <div ref={containerRef} id='container'>
        <canvas ref={canvasRef} width={width()} height={height()} />
      </div>

      <div class="sidebar" id="sidebar">
        <input type="button" value="Small" onClick={() => setBrushStroke(SMALL_BRUSH_SIZE)} />
        <input type="button" value="Medium" onClick={() => setBrushStroke(MEDIUM_BRUSH_SIZE)} />
        <input type="button" value="Large" onClick={() => setBrushStroke(LARGE_BRUSH_SIZE)} />
        <input type="button" value="Erase" onClick={() => setBrushStroke(LARGE_BRUSH_SIZE)} />

        <input type="button" value="Undo" onClick={() => setBrushStroke(LARGE_BRUSH_SIZE)} />
        <input type="button" value="Redo" onClick={() => setBrushStroke(LARGE_BRUSH_SIZE)} />
        <input type="button" value="Fill" onClick={() => setBrushStroke(LARGE_BRUSH_SIZE)} />

        <input type="color" onInput={element => changeColor(element.target.value)} />
      </div>

      <style>
        {`
          .sidebar {
            position: fixed;
            left: 5%;
            background-color: #666666;
            padding: 5px;
            display: grid;
          }

          .sidebar button {
            display: block;
            margin: 3px;
          }

          #container {
            border: solid 2px red;
            position: fixed;
            left: 25%;
            right: auto;
            top: 0;
          }
        `}
      </style>
    </>
  );
}

export function ArtistCanvasComponent() {
  return (
    <div class="artist-canvas-component">
      <h1>Artist Canvas Component</h1>
      <DrawCanvas prompt={"Tis be a prompt"} />
    </div>
  );
}
