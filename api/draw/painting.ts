import Konva from "konva"

export interface Brush {
  // Hex (RGB) -- Ex: #FFFFFF
  color: string
  strokeWidth: number
}

export class PaintCanvas {
  private image: Konva.Image
  private layer: Konva.Layer
  private context: CanvasRenderingContext2D | null

  isErasing: boolean
  currentBrush: Brush

  // Initializes internals of PaintCanvas and sets up
  // callbacks for drawing.
  constructor(
    canvas: HTMLCanvasElement,
    pos: Konva.Vector2d,
    stage: Konva.Stage,
    brush: Brush
  ) {
    this.image = new Konva.Image({
      image: canvas,
      x: pos.x,
      y: pos.y
    });

    this.layer = new Konva.Layer();

    this.layer.add(this.image);

    this.context = canvas.getContext('2d');

    this.currentBrush = brush;

    this.isErasing = false;

    let lastMousePos: Konva.Vector2d;
    let isPainting = false;

    this.image.on('mousedown', () => {
      lastMousePos = stage.getPointerPosition() as Konva.Vector2d;
      isPainting = true;

      if (this.context == null) return;

      let context = this.context as CanvasRenderingContext2D;

      if (this.isErasing) {
        context.globalCompositeOperation = "destination-out";
      } else {
        context.globalCompositeOperation = "source-over";
      }
    });

    this.image.on('mouseup', () => {
      isPainting = false;

      this.context?.beginPath();

      let radius = this.currentBrush.strokeWidth;
      // The radius of the circle drawn doesn't always match
      // the stroke width leading to noticeable bulges at the tip
      // of lines. Halving the radius is arbitrary, but fixes the problem
      // while still being able to draw dots.
      if (radius > 1) {
        radius /= 2;
      }

      this.context?.arc(
        lastMousePos.x,
        lastMousePos.y,
        radius,
        0,
        Math.PI * 2
      );

      if (this.context != null) {
        let context = this.context as CanvasRenderingContext2D;
        context.fillStyle = this.currentBrush.color;
      }

      this.context?.fill();
      this.layer.batchDraw();
    });

    this.layer.on('mousemove', () => {
      if (!isPainting) return;

      let localPos = {
        x: lastMousePos.x - this.image.x(),
        y: lastMousePos.y - this.image.y(),
      };

      let newMousePos = stage.getPointerPosition() as Konva.Vector2d;
      let newLocalPos = {
        x: newMousePos.x - this.image.x(),
        y: newMousePos.y - this.image.y()
      };

      if (this.context != null) {
        let context = this.context as CanvasRenderingContext2D;
        context.lineWidth = this.currentBrush.strokeWidth;
        context.strokeStyle = this.currentBrush.color;
        context.lineJoin = "round";
      }

      this.context?.beginPath();

      this.context?.moveTo(localPos.x, localPos.y);
      this.context?.lineTo(newLocalPos.x, newLocalPos.y);

      this.context?.closePath();

      this.context?.stroke();

      lastMousePos = newLocalPos;
      this.layer.batchDraw();
    });

    stage.add(this.layer);
  }
}
