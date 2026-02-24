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
import { ArtistBar } from "../../src/components/ArtistBar";

const DEFAULT_BRUSH = { color: "#000000", strokeWidth: 5 };

const VIRTUAL_WIDTH = 600;
const VIRTUAL_HEIGHT = 600;



function DrawCanvas(props: { prompt: string }) {
  let containerRef: HTMLDivElement | undefined;

  let [paintMode, setPaintMode] = createSignal(PaintMode.DRAW);
  let [brush, setBrush] = createSignal(DEFAULT_BRUSH);
  const [paintCanvas, setPaintCanvas] = createSignal<PaintCanvas>();

  let stage: konva.Stage;
  let canvas: HTMLCanvasElement;

  onMount(() => {
    if (!containerRef) {
      return;
    }

    const rect = containerRef.getBoundingClientRect();

    stage = new konva.Stage({
      container: containerRef,
      width: VIRTUAL_WIDTH,
      height: VIRTUAL_HEIGHT,
    });

    canvas = document.createElement('canvas');

    const pc = new PaintCanvas(
      canvas,
      { x: 0, y: 0 },
      stage,
      DEFAULT_BRUSH,
      false,
      { width: VIRTUAL_WIDTH, height: VIRTUAL_HEIGHT },
      { width: VIRTUAL_WIDTH, height: VIRTUAL_HEIGHT },
    );

    pc.setNetworkCallbacks({
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

    setPaintCanvas(pc);

    onCleanup(() => {
      stage.destroy();
    });
  });

  createEffect(() => {
    const pc = paintCanvas();
    if (pc) {
      pc.setPaintMode(paintMode());
      pc.setBrushColor(brush().color);
      pc.setBrushStrokeWidth(brush().strokeWidth);
    }
  });

  return (
    <>
      <div class="draw-root-container">
        <h1 class="draw-header">DRAW: {props.prompt.toUpperCase()}</h1>
        <div class="draw-workspace">
          <ArtistBar
            brush={brush}
            setBrush={setBrush}
            paintMode={paintMode}
            setPaintMode={setPaintMode}
            paintCanvas={paintCanvas()}
          />

          <div ref={containerRef} id="container" class="canvas-container"></div>
        </div>
      </div>
    </>
  );
}

export function SpectatorCanvas(props: {
  artist: PlayerState;
  scale?: number;
}) {
  let containerRef: HTMLDivElement | undefined;
  const scale = props.scale || 1.0;
  let stage: konva.Stage;
  let canvas: HTMLCanvasElement;
  let paintCanvas: PaintCanvas;

  onMount(() => {
    if (!containerRef) {
      return;
    }

    const scale = props.scale || 1.0;
    const displayWidth = VIRTUAL_WIDTH * scale;
    const displayHeight = VIRTUAL_HEIGHT * scale;

    const onStrokeBeginClean = RPC.register(
      "onStrokeBegin",
      async (payload: NetworkStrokePayload, player) => {
        if (player.id !== props.artist.id) return;
        paintCanvas.clientStartRecordStroke();
        paintCanvas.handleRemoteStroke(payload);
      },
    );

    const onStrokeMoveClean = RPC.register(
      "onStrokeMove",
      async (payload: NetworkStrokePayload, player) => {
        if (player.id !== props.artist.id) return;
        paintCanvas.handleRemoteStroke(payload);
      },
    );

    const onStrokeEndClean = RPC.register(
      "onStrokeEnd",
      async (payload: BoundingBox, player) => {
        if (player.id !== props.artist.id) return;
        paintCanvas.registerUndoClient(payload);
      },
    );

    const onFillClean = RPC.register(
      "onFill",
      async (payload: NetworkFillPayload, player) => {
        if (player.id !== props.artist.id) return;
        paintCanvas.fill(payload.x, payload.y, payload.color);
      },
    );

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
      width: displayWidth,
      height: displayHeight,
    });

    if (containerRef) {
      containerRef.style.width = `${displayWidth}px`;
      containerRef.style.height = `${displayHeight}px`;
    }

    canvas = document.createElement("canvas");

    paintCanvas = new PaintCanvas(
      canvas,
      { x: 0, y: 0 },
      stage,
      DEFAULT_BRUSH,
      true, // isSpectator
      { width: displayWidth, height: displayHeight }, // baseSize
      { width: VIRTUAL_WIDTH, height: VIRTUAL_HEIGHT }, // virtualSize
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

        <div
          ref={containerRef}
          id="container-spectator"
          class="canvas-container"
        ></div>
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
