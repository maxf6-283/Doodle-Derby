import konva from "konva"

import { PaintCanvas } from "./api/draw/painting"

let stage = new konva.Stage({
  container: 'container',
  width: window.innerWidth,
  height: window.innerHeight
});

const canvas: HTMLCanvasElement = document.createElement('canvas');
canvas.width = stage.width();
canvas.height = stage.height();

let paint = new PaintCanvas(
  canvas,
  { x: 0, y: 0 },
  stage,
  { color: "#ff0000", strokeWidth: 10 }
);

window.addEventListener("keydown", ev => {
  if (ev.key == "e") {
    paint.setErasing(!paint.isErasing);
  }
  if (ev.key == "u") {
    paint.undo();
  }

  if (ev.key == "r") {
    paint.redo();
  }
});


