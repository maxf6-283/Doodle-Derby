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

//const small_button = document.getElementById('small-button') as HTMLInputElement;
//const med_button = document.getElementById('med-button') as HTMLInputElement;
//const large_button = document.getElementById('large-button') as HTMLInputElement;
//const color_button = document.getElementById('color-button') as HTMLInputElement;
const slider = document.getElementById('sliderContainer') as HTMLDivElement;
const brush_size = document.getElementById('brushSize') as HTMLInputElement;
const brush_value = document.getElementById('brushValue') as HTMLElement;
const brush_btn = document.getElementById('brush') as HTMLButtonElement;
const color_btn = document.getElementById('color_change') as HTMLButtonElement;
const cl_menu = document.getElementById('cl_menu') as HTMLDivElement;
const red_btn = document.getElementById('red') as HTMLButtonElement;

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

//small_button.addEventListener('click', () => changeBrushSize(10));
//med_button.addEventListener('click', () => changeBrushSize(20));
//large_button.addEventListener('click', () => changeBrushSize(30));
// color_button.addEventListener('change', () => changeColor(color_button.value));

color_btn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    cl_menu.classList.toggle('hidden');
})
red_btn.addEventListener('click', () => {
    changeColor('red');
})
brush_size.addEventListener('input', () => {
    brush_value.innerText = brush_size.value;
    changeBrushSize(Number(brush_size.value));
})

brush_btn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    slider.classList.toggle('hidden');
})
slider.addEventListener('click', (ev) => {
    ev.stopPropagation();
});

window.addEventListener('click', () => {
    if (!slider.classList.contains('hidden')) {
        slider.classList.add('hidden');
    }
    if (!cl_menu.classList.contains('hidden')) {
        cl_menu.classList.add('hidden');
    }
});

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


