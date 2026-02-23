import "solid-js/web";

import konva from "konva";
import { onCleanup, createSignal, createEffect, onMount } from "solid-js";

import { PlayerState } from "playroomkit";

import {
  PaintMode,
  PaintCanvas,
  Brush,
  NetworkFillPayload,
  NetworkStrokePayload,
  BoundingBox,
} from "./painting";

import { RPC } from "playroomkit";

const SMALL_BRUSH_SIZE = 5;
const MEDIUM_BRUSH_SIZE = 10;
const LARGE_BRUSH_SIZE = 20;
const EXTREME_BRUSH_SIZE = 30;

const DEFAULT_BRUSH = { color: "#000000", strokeWidth: 5 };

function DrawCanvas(props: { prompt: string }) {
  let containerRef: HTMLDivElement | undefined;

  let [width, setWidth] = createSignal(600);
  let [height, setHeight] = createSignal(600);

  let [paintMode, setPaintMode] = createSignal(PaintMode.DRAW);
  let [brush, setBrush] = createSignal(DEFAULT_BRUSH);

  let stage: konva.Stage;
  let canvas: HTMLCanvasElement;
  let paintCanvas: PaintCanvas;

  onMount(() => {
    if (!containerRef) {
      return;
    }

    const rect = containerRef.getBoundingClientRect();
    setWidth(rect.width);
    setHeight(rect.height);

    stage = new konva.Stage({
      container: containerRef,
      width: width(),
      height: height(),
    });

    canvas = stage.toCanvas();

    paintCanvas = new PaintCanvas(canvas, { x: 0, y: 0 }, stage, DEFAULT_BRUSH);

    paintCanvas.setNetworkCallbacks({
      onStrokeBegin: (payload: NetworkStrokePayload) => {
        RPC.call("onStrokeBegin", payload, RPC.Mode.OTHERS);
      },
      onStrokeMove: (
        points: [number, number][],
        currentBrush: Brush,
        currentPaintMode: PaintMode,
      ) => {
        let payload: NetworkStrokePayload = {
          points,
          currentBrush,
          paintMode: currentPaintMode,
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
          color,
        };
        RPC.call("onFill", payload, RPC.Mode.OTHERS);
      },
      onUndo: () => {
        RPC.call("onUndo", {}, RPC.Mode.OTHERS);
      },
      onRedo: () => {
        RPC.call("onRedo", {}, RPC.Mode.OTHERS);
      },
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
  };

  const setModeFill = () => {
    if (paintMode() == PaintMode.FILL) {
      setPaintMode(PaintMode.DRAW);
      return;
    }

    setPaintMode(PaintMode.FILL);
  };

  const setBrushStroke = (stroke: number) => {
    setBrush((prevBrush) => {
      prevBrush.strokeWidth = stroke;
      return prevBrush;
    });
  };

  const changeColor = (color: string) => {
    setBrush((prevBrush) => {
      prevBrush.color = color;
      return prevBrush;
    });
  };

  return (
    <>
      <div
        style={{
          position: "fixed", // This is temporary styling, I hope!
          top: "0%",
          right: "5%",
          "z-index": 1,
          "max-width": "20vw", // ensure it doesn't overflow the viewport
          width: "max-content", // only as wide as content, but will wrap if too long
          "word-break": "break-word", // wrap long words
          "white-space": "normal", // allow wrapping
        }}
      >
        <h1
          style={{
            margin: 0,
            "word-break": "break-word",
            "white-space": "normal",
          }}
        >
          {props.prompt.toUpperCase()}
        </h1>
        <div
          ref={containerRef}
          id="container"
          style={{ width: "400px", height: "400px" }}
        ></div>
      </div>

      <div class="sidebar" id="sidebar">
        <input
          type="button"
          value="Small"
          onClick={() => setBrushStroke(SMALL_BRUSH_SIZE)}
        />
        <input
          type="button"
          value="Medium"
          onClick={() => setBrushStroke(MEDIUM_BRUSH_SIZE)}
        />
        <input
          type="button"
          value="Large"
          onClick={() => setBrushStroke(LARGE_BRUSH_SIZE)}
        />
        <input
          type="button"
          value="Extreme"
          onClick={() => setBrushStroke(EXTREME_BRUSH_SIZE)}
        />
        <input type="button" value="Erase" onClick={() => setModeErase()} />

        <input type="button" value="Undo" onClick={() => paintCanvas.undo()} />
        <input type="button" value="Redo" onClick={() => paintCanvas.redo()} />
        <input type="button" value="Fill" onClick={() => setModeFill()} />

        <input
          type="color"
          onInput={(element) => changeColor(element.target.value)}
        />
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

export function SpectatorCanvas(props: { artist: PlayerState }) {
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

    const onStrokeBeginClean = RPC.register(
      "onStrokeBegin",
      async (payload: NetworkStrokePayload, player) => {
        if (player.id !== props.artist.id) return;
        paintCanvas.clientStartRecordStroke();
        paintCanvas.drawPointsClient(
          payload.points,
          payload.currentBrush,
          payload.paintMode,
        );
      },
    );

    const onStrokeMoveClean = RPC.register(
      "onStrokeMove",
      async (payload: NetworkStrokePayload, player) => {
        if (player.id !== props.artist.id) return;
        paintCanvas.drawPointsClient(
          payload.points,
          payload.currentBrush,
          payload.paintMode,
        );
      },
    );

    const onStrokeEndClean = RPC.register("onStrokeEnd", async (payload: BoundingBox, player) => {
      if (player.id !== props.artist.id) return;
      paintCanvas.registerUndoClient(payload);
    });

    const onFillClean = RPC.register("onFill", async (payload: NetworkFillPayload, player) => {
      if (player.id !== props.artist.id) return;
      paintCanvas.fill(payload.x, payload.y, payload.color);
    });

    const onUndoClean = RPC.register("onUndo", async (_, player) => {
      if (player.id !== props.artist.id) return;
      paintCanvas.undo();
    });

    const onRedoClean = RPC.register("onRedo", async (_, player) => {
      if (player.id !== props.artist.id) return;
      paintCanvas.redo();
    });

    stage = new konva.Stage({
      container: containerRef,
      width: width(),
      height: height(),
    });

    canvas = stage.toCanvas();

    paintCanvas = new PaintCanvas(
      canvas,
      { x: 0, y: 0 },
      stage,
      DEFAULT_BRUSH,
      true,
    );

    onCleanup(() => {
      stage.destroy();
      onStrokeBeginClean();
      onStrokeEndClean();
      onStrokeMoveClean();
      onFillClean();
      onUndoClean();
      onRedoClean();
    });
  });

  return (
    <>
      <h1> {props.artist.getState("name")} </h1>
      <div ref={containerRef} id="container-spectator"></div>
    </>
  );
}

export function GuessElement(props: { promptLength: number }) {
    let [text, setText] = createSignal("");
    let containerRef: HTMLDivElement | undefined;

    const handleContainerClick = () => {
        const inputs = containerRef?.querySelectorAll('input') as NodeListOf<HTMLInputElement>;
        let hasInput = Array.from(inputs).find(input => input.value);
        if (inputs) {
            if (!hasInput) inputs[0].focus();
        }
    };

    const handleInput = (e: InputEvent & { currentTarget: HTMLInputElement }) => {
        const input = e.currentTarget;
        if (input.value.length >= 1) {
            const next = input.parentElement?.nextElementSibling?.querySelector('input');
            if (next) (next as HTMLInputElement).focus();
        }
    };
    return (
        <>
            <div class='guessContainer' ref={containerRef} onClick={handleContainerClick}>
                {Array.from({ length: props.promptLength }).map(() => (
                    <>
                        <div class="input-unit">
                            <input
                                class="letter-input"
                                type="text"
                                maxlength="1"
                                onInput={handleInput}
                                onChange={(c) => setText((text) => (text = c.currentTarget.value))} />
                            <div class="bold-dash"></div >
                        </div>
                    </>
                ))}
            </div>
            <style>
                {
                    `.guessContainer {
                position: relative;
                display: flex;
                gap: 15px;
                justify-content: center;
                margin-top: 2rem;
            }

            .input-unit {
                position: relative;
                top:100%;
                display: flex;
                flex-direction: column;
                align-items: center;
            }

            .letter-input {
                width: 40px;
                background: transparent;
                border: none;
                text-align: center;
                font-size: 2.5rem;
                font-weight: 500;
                color: #2c3e50;
                text-transform: uppercase;
                outline: none;
            }

            .bold-dash {
                width: 100%;
                height: 6px;
                background-color: #2c3e50;
                border-radius: 10px;
            }`
                }
            </style>
        </>
    );
}

export function ArtistCanvasComponent(props: { prompt: string }) {
  return (
    <div class="artist-canvas-component">
      <DrawCanvas prompt={props.prompt} />
    </div>
  );
}
