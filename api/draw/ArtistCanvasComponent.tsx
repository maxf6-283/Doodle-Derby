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
import { CanvasButton } from "../../src/components/CanvasButton";
import { PlayerAvatar } from "../../src/components/PlayerAvatar";

const SMALL_BRUSH_SIZE = 5;
const MEDIUM_BRUSH_SIZE = 10;
const LARGE_BRUSH_SIZE = 20;
const EXTREME_BRUSH_SIZE = 30;

const DEFAULT_BRUSH = { color: "#000000", strokeWidth: 5 };

function DrawCanvas(props: { prompt: string }) {
  let containerRef: HTMLDivElement | undefined;

  

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
  

    stage = new konva.Stage({
      container: containerRef,
      width: rect.width,
      height: rect.height,
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

  const setBrushStroke = (stroke: number) => {
    setBrush((prevBrush) => ({
      ...prevBrush,
      strokeWidth: stroke,
    }));
  };

  const changeColor = (color: string) => {
    setBrush((prevBrush) => ({
      ...prevBrush,
      color: color,
    }));
  };

  return (
    <>
      <div class="draw-root-container">
        <h1
          class="draw-header"
        >
          DRAW: {props.prompt.toUpperCase()}
        </h1>
        <div
          class="draw-workspace"
        >
          <div class="sidebar" id="sidebar">
            {/* Brush Sizes */}
            <div class="sidebar-options-container">
              <CanvasButton
                icon="/drawing/small_brush.png"
                alt="Small"
                isActive={brush().strokeWidth === SMALL_BRUSH_SIZE}
                onClick={() => setBrushStroke(SMALL_BRUSH_SIZE)}
                size="64px"
                top="60%"
                left="55%"
              />
              <CanvasButton
                icon="/drawing/medium_brush.png"
                alt="Medium"
                isActive={brush().strokeWidth === MEDIUM_BRUSH_SIZE}
                onClick={() => setBrushStroke(MEDIUM_BRUSH_SIZE)}
                size="64px"
                top="60%"
                left="55%"
              />
              <CanvasButton
                icon="/drawing/large_brush.png"
                alt="Large"
                isActive={brush().strokeWidth === LARGE_BRUSH_SIZE}
                onClick={() => setBrushStroke(LARGE_BRUSH_SIZE)}
                size="64px"
                top="60%"
                left="55%"
              />
              <CanvasButton
                icon="/drawing/extreme_brush.png"
                alt="Extreme"
                isActive={brush().strokeWidth === EXTREME_BRUSH_SIZE}
                onClick={() => setBrushStroke(EXTREME_BRUSH_SIZE)}
                size="64px"
                top="60%"
                left="55%"
              />
            </div>

            {/* Modes */}
            <div class="sidebar-options-container">
              <CanvasButton
                icon="/drawing/paintbrush.png"
                alt="Fill"
                isActive={paintMode() === PaintMode.DRAW}
                onClick={() => setPaintMode(PaintMode.DRAW)}
                top="50%"
                left="50%"
              />
              <CanvasButton
                icon="/drawing/eraser.png"
                alt="Erase"
                isActive={paintMode() === PaintMode.ERASE}
                onClick={() => setPaintMode(PaintMode.ERASE)}
                top="50%"
                left="50%"
              />
              <CanvasButton
                icon="/drawing/bucket.png"
                alt="Fill"
                isActive={paintMode() === PaintMode.FILL}
                onClick={() => setPaintMode(PaintMode.FILL)}
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
                onClick={() => paintCanvas.undo()}
                size="64px"
                top="50%"
                left="50%"
                transparent={true}
              />
              <CanvasButton
                icon="/drawing/redo_button.png"
                alt="Redo"
                isActive={false}
                onClick={() => paintCanvas.redo()}
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
          <div
            ref={containerRef}
            id="container"
            class="canvas-container"
          ></div>
        </div>
      </div>

      <style>
        {`
          

          
        `}
      </style>
    </>
  );
}

export function SpectatorCanvas(props: { artist: PlayerState }) {
  let containerRef: HTMLDivElement | undefined;

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

    const rect = containerRef.getBoundingClientRect();
    

    stage = new konva.Stage({
      container: containerRef,
      width: rect.width,
      height: rect.height,
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
    <div class="draw-root-container">
      <div class="spectator-header-container">
        <PlayerAvatar player={props.artist}></PlayerAvatar>
        <div class="spectator-name-header">
          {props.artist.getState("name")}
        </div>
      </div>
      
      <div ref={containerRef} id="container-spectator" class="canvas-container"></div>
    </div>
      
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
