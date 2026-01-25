import konva from "konva"

import { PaintCanvas } from "./api/draw/painting"

let stage = new konva.Stage({
  container: 'container',
  width: 600,
  height: 600
});

const canvas: HTMLCanvasElement = document.createElement('canvas');
canvas.width = stage.width();
canvas.height = stage.height();

const small_button = document.getElementById('small-button') as HTMLInputElement;
const med_button = document.getElementById('med-button') as HTMLInputElement;
const large_button = document.getElementById('large-button') as HTMLInputElement;
const color_button = document.getElementById('color-button') as HTMLInputElement;

let paint = new PaintCanvas(
  canvas,
  { x: 0, y: 0 },
  stage,
  { color: "#0000ff", strokeWidth: 10 }
);

export function changeBrushSize(size: number) {
    paint.setBrushStrokeWidth(size);
}

export function changeColor(color: string) {
    paint.setBrushColor(color);
}

small_button.addEventListener('click', () => changeBrushSize(10));
med_button.addEventListener('click', () => changeBrushSize(20));
large_button.addEventListener('click', () => changeBrushSize(30));
// color_button.addEventListener('change', () => changeColor(color_button.value));

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


