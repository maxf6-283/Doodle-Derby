import 'solid-js/web';

import konva from "konva";
import { onCleanup, createSignal, createEffect, onMount } from 'solid-js';

import {
  PaintMode,
  PaintCanvas,
  Brush,
  NetworkFillPayload,
  NetworkStrokePayload,
  BoundingBox,
} from './painting';

import { RPC } from 'playroomkit';

const SMALL_BRUSH_SIZE = 5;
const MEDIUM_BRUSH_SIZE = 20;
const LARGE_BRUSH_SIZE = 30;

const DEFAULT_BRUSH = { color: "#000000", strokeWidth: 5 };

function DrawCanvas(props: { prompt: string }) {
  let containerRef: HTMLDivElement | undefined;

  let [width] = createSignal(600);
  let [height] = createSignal(600);

  let [paintMode, setPaintMode] = createSignal(PaintMode.DRAW);
  let [brush, setBrush] = createSignal(DEFAULT_BRUSH);

  let stage: konva.Stage;
  let canvas: HTMLCanvasElement;
  let paintCanvas: PaintCanvas;

  onMount(() => {
    if (!containerRef) {
      return;
    }

    stage = new konva.Stage({
      container: containerRef,
      width: width(),
      height: height()
    });

    canvas = stage.toCanvas();

    paintCanvas = new PaintCanvas(
      canvas,
      { x: 0, y: 0 },
      stage,
      DEFAULT_BRUSH
    );

    paintCanvas.setNetworkCallbacks({
      onStrokeBegin: (payload: NetworkStrokePayload) => {
        RPC.call("onStrokeBegin", payload, RPC.Mode.OTHERS);
      },
      onStrokeMove: (points: [number, number][], currentBrush: Brush, currentPaintMode: PaintMode) => {
        let payload: NetworkStrokePayload = {
          points,
          currentBrush,
          paintMode: currentPaintMode
        };
        RPC.call("onStrokeMove", payload, RPC.Mode.OTHERS);
      },
      onStrokeEnd: (boundingBox: BoundingBox) => {
        RPC.call("onStrokeEnd", boundingBox, RPC.Mode.OTHERS);
      },
      onFill: (x: number, y: number, color: string) => {
        let payload: NetworkFillPayload = {
          x,
          y,
          color
        };
        RPC.call("onFill", payload, RPC.Mode.OTHERS);
      },
      onUndo: () => {
        RPC.call("onUndo", {}, RPC.Mode.OTHERS);
      },
      onRedo: () => {
        RPC.call("onRedo", {}, RPC.Mode.OTHERS);
      }
    });

    onCleanup(() => {
      stage.destroy();
    });
  });

  createEffect(() => {
    paintCanvas.setPaintMode(paintMode());
    paintCanvas.setBrushColor(brush().color);
    paintCanvas.setBrushStrokeWidth(brush().strokeWidth);
  });

  const setModeErase = () => {
    if (paintMode() == PaintMode.ERASE) {
      setPaintMode(PaintMode.DRAW);
      return;
    }
    setPaintMode(PaintMode.ERASE);
  }

  const setModeFill = () => {
    if (paintMode() == PaintMode.FILL) {
      setPaintMode(PaintMode.DRAW);
      return;
    }

    setPaintMode(PaintMode.FILL);
  }

  const setBrushStroke = (stroke: number) => {
    setBrush(prevBrush => {
      prevBrush.strokeWidth = stroke;
      return prevBrush;
    });
  }

  const changeColor = (color: string) => {
    setBrush(prevBrush => {
      prevBrush.color = color;
      return prevBrush;
    });
  }

  return (
    <>
      <div style={{
        position: "fixed", // This is temporary styling, I hope!
        top: "0%",
        right: "5%",
        "z-index": 1,
        "max-width": "20vw", // ensure it doesn't overflow the viewport
        width: "max-content", // only as wide as content, but will wrap if too long
        "word-break": "break-word", // wrap long words
        "white-space": "normal" // allow wrapping
      }}>
        <h1 style={{
          margin: 0,
          "word-break": "break-word",
          "white-space": "normal"
        }}>
          {props.prompt.toUpperCase()}
        </h1>
      </div>

      <div ref={containerRef} id='container'>
      </div>

      <div class="sidebar" id="sidebar">
        <input type="button" value="Small" onClick={() => setBrushStroke(SMALL_BRUSH_SIZE)} />
        <input type="button" value="Medium" onClick={() => setBrushStroke(MEDIUM_BRUSH_SIZE)} />
        <input type="button" value="Large" onClick={() => setBrushStroke(LARGE_BRUSH_SIZE)} />
        <input type="button" value="Erase" onClick={() => setModeErase()} />

        <input type="button" value="Undo" onClick={() => paintCanvas.undo()} />
        <input type="button" value="Redo" onClick={() => paintCanvas.redo()} />
        <input type="button" value="Fill" onClick={() => setModeFill()} />

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

export function SpectatorCanvas(props: { artistId: string }) {
  let containerRef: HTMLDivElement | undefined;

  let [width] = createSignal(600);
  let [height] = createSignal(600);

  let stage: konva.Stage;
  let canvas: HTMLCanvasElement;
  let paintCanvas: PaintCanvas;


  onMount(() => {
    if (!containerRef) {
      return;
    }

    RPC.register("onStrokeBegin", async (payload: NetworkStrokePayload, player) => {
      if (player.id !== props.artistId) return;
      paintCanvas.clientStartRecordStroke();
      paintCanvas.drawPointsClient(payload.points, payload.currentBrush, payload.paintMode);
    });

    RPC.register("onStrokeMove", async (payload: NetworkStrokePayload, player) => {
      if (player.id !== props.artistId) return;
      paintCanvas.drawPointsClient(payload.points, payload.currentBrush, payload.paintMode);
    });

    RPC.register("onStrokeEnd", async (payload: BoundingBox, player) => {
      if (player.id !== props.artistId) return;
      paintCanvas.registerUndoClient(payload)
    });

    RPC.register("onFill", async (payload: NetworkFillPayload, player) => {
      if (player.id !== props.artistId) return;
      paintCanvas.fill(payload.x, payload.y, payload.color);
    });

    RPC.register("onUndo", async (_, player) => {
      if (player.id !== props.artistId) return;
      paintCanvas.undo();
    });

    RPC.register("onRedo", async (_, player) => {
      if (player.id !== props.artistId) return;
      paintCanvas.redo();
    });

    stage = new konva.Stage({
      container: containerRef,
      width: width(),
      height: height()
    });

    canvas = stage.toCanvas();

    paintCanvas = new PaintCanvas(
      canvas,
      { x: 0, y: 0 },
      stage,
      DEFAULT_BRUSH,
      true
    );

    onCleanup(() => {
      stage.destroy();
    });
  });

  return (
    <>
      <h1>
        Spectating Host
      </h1>
      <div ref={containerRef} id='container-spectator'>
      </div>
    </>
  );
}

export function ArtistCanvasComponent() {
  return (
    <div class="artist-canvas-component">
      <h1>Artist Canvas Component</h1>
      <DrawCanvas prompt={"Donkey"} />
    </div>
  );
}
