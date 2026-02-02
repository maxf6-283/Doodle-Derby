import Konva from "konva"

import { CurveInterpolator } from "curve-interpolator";
import { Vector2d } from "konva/lib/types";

export interface Brush {
  // Hex (RGB) -- Ex: #FFFFFF
  color: string
  strokeWidth: number
}

export enum PaintActionType {
  Draw,
  Erase,
  Fill
}

type PointsArray = [number, number][]

// Array of tuples to construct a user's stroke
type Strokes = PointsArray[];

export interface PaintAction {
  // Array of connecting points
  points: Strokes,
  type: PaintActionType,
  brush: Brush
}

export class PaintCanvas {
  private image: Konva.Image
  private layer: Konva.Layer
  private context: CanvasRenderingContext2D

  private _isErasing: boolean
  private currentBrush: Brush

  private undoBuffer: PaintAction[]
  private redoBuffer: PaintAction[]

  private canvasWidth: number
  private canvasHeight: number

  private pointsBuffer: [number, number][] = []

  private requiredPoints: number = 4

  // Track if fill bucket was used
  private hasFilled: boolean = false;

  // Track if undo or redo was used
  private hasReverted: boolean = false;

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

    this.context = canvas.getContext('2d') as CanvasRenderingContext2D;

    this.currentBrush = brush;

    this._isErasing = false;

    this.undoBuffer = [];
    this.redoBuffer = [];


    // default initialization, it
    // doesn't mean anything yet.

    // When pushing to the undo buffer, it is very important
    // this gets copied because this variable is reused across
    // all callbacks.
    let paintAction: PaintAction = {
      points: [],
      type: PaintActionType.Draw,
      brush: { ...this.currentBrush }
    };

    let isPainting = false;
    let imageData: ImageData | null = null;

    const submitDraw = () => {
      if (imageData != null) {
        this.context.putImageData(imageData, 0, 0);
      }

      this.layer.batchDraw();
    };

    const draw = (imageData: ImageData, clicked: boolean = false) => {
      let currentMousePos = stage.pointerPos as Vector2d;
      let pos: [number, number] = [
        currentMousePos.x - this.layer.getPosition().x,
        currentMousePos.y - this.layer.getPosition().y
      ];

      this.pointsBuffer.push(pos);

      if (this.pointsBuffer.length > this.requiredPoints) {
        submitDraw();
        paintAction.points.push(this.pointsBuffer.slice());
        this.pointsBuffer.shift();
      }

      if (clicked) {
        paintAction.points.push(this.pointsBuffer.slice());
      }

      this.drawPoint(this.pointsBuffer, brush, this.isErasing, imageData);
    };

    const finish = () => {
      submitDraw();
      isPainting = false;
      this.undoBuffer.push({
        ...paintAction
      });

      paintAction.points = [];
      this.pointsBuffer = [];
    }

    this.image.on('mouseup', () => {
      finish();
    });

    this.image.on('mouseleave', () => {
      if (!isPainting) return;
      if (imageData == null) return;
      draw(imageData);
      finish();
    });

    this.image.on('mousedown', () => {
      if (imageData == null ||
        this.hasFilled ||
        this.hasReverted
      ) {
        imageData = this.getImageData();
        this.hasFilled = false;
        this.hasReverted = false;
      }

      isPainting = true;

      paintAction.brush = {
        ...this.currentBrush
      };

      paintAction.type = this.isErasing ?
        PaintActionType.Erase :
        PaintActionType.Draw;

      this.redoBuffer = [];

      draw(imageData, true);
    });

    this.image.on('mousemove', () => {
      if (!isPainting || imageData == null) return;
      draw(imageData);
    });

    stage.add(this.layer);

    this.canvasWidth = this.layer.getWidth() as number;
    this.canvasHeight = this.layer.getHeight() as number;

    this.clear();
  }

  private getImageData() {
    return this.context.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
  }

  get isErasing() {
    return this._isErasing;
  }

  setErasing(isErasing: boolean) {
    this._isErasing = isErasing;
  }

  get brushColor() {
    return this.currentBrush.color;
  }

  get brushStrokeWidth() {
    return this.currentBrush.strokeWidth;
  }

  setBrush(brush: Brush) {
    this.currentBrush = brush;
  }

  setBrushColor(color: string) {
    this.currentBrush.color = color;
  }

  setBrushStrokeWidth(strokeWidth: number) {
    if (strokeWidth <= 0) {
      console.error(`Trying to update strokeWidth with ${strokeWidth} which doesn't make sense.`);
      return;
    }
    this.currentBrush.strokeWidth = strokeWidth;
  }

  private clear() {
    let imageData = this.getImageData();

    for (let i = 0; i < this.canvasWidth * this.canvasHeight; ++i) {
      let index = i * 4;
      imageData.data[index] = 255;
      imageData.data[index + 1] = 255;
      imageData.data[index + 2] = 255;
      imageData.data[index + 3] = 255;
    }

    this.context.putImageData(imageData, 0, 0);
    this.layer.batchDraw();
  }


  private hexToRGB(hex: string) {
    return [
      parseInt(hex.substring(1, 3), 16),
      parseInt(hex.substring(3, 5), 16),
      parseInt(hex.substring(5, 7), 16),
      255
    ];
  }

  private drawPixel(point: [number, number], color: string, image: ImageData) {
    let colorRGB = this.hexToRGB(color);
    let width = this.layer.getWidth() as number;
    let height = this.layer.getHeight() as number;

    let y = Math.floor(point[1]);
    let x = Math.floor(point[0]);

    if (x < 0 || x >= width) return;
    if (y < 0 || y >= height) return;

    let index = (y * width + x) * 4;

    image.data[index] = colorRGB[0];
    image.data[index + 1] = colorRGB[1];
    image.data[index + 2] = colorRGB[2];
    image.data[index + 3] = 255;
  }

  /*
    Based on: https://stackoverflow.com/questions/1201200/fast-algorithm-for-drawing-filled-circles
    (AlexGeorg)
  */
  private drawCircle(point: [number, number], radius: number, color: string, image: ImageData) {
    for (let x = -radius; x < radius; ++x) {
      let hh = Math.sqrt(radius * radius - x * x);

      let rx = point[0] + x;
      let ph = point[1] + hh;

      for (let y = point[1] - hh; y <= ph; ++y) {
        this.drawPixel([rx, y], color, image);
      }
    }
  }

  private drawSegment(points: [number, number][], radius: number, color: string, image: ImageData) {
    if (points.length < this.requiredPoints) return;

    const interp = new CurveInterpolator(
      points,
      { tension: 0, alpha: 0.5 }
    );

    const segments = 100;

    const interpolated_points = interp.getPoints(segments);

    for (let point of interpolated_points) {
      this.drawCircle(point, radius, color, image);
    }
  }

  private drawPoint(
    points: [number, number][],
    brush: Brush,
    isErasing: boolean,
    image: ImageData
  ) {
    if (points.length == 0) {
      console.warn("Trying to draw point with 0 points?");
      return;
    }

    let color = isErasing ? "#ffffff" : brush.color;

    let radius = brush.strokeWidth;

    // The radius of the circle drawn doesn't always match
    // the stroke width leading to noticeable bulges at the tip
    // of lines. Halving the radius is arbitrary, but fixes the problem
    // while still being able to draw dots.
    if (radius > 1) {
      radius /= 2;
    }

    this.drawCircle(points[0], radius, color, image);

    if (points.length > 1) {
      this.drawSegment(
        points,
        radius,
        color,
        image
      );
    }
  }

  private recreateBuffer(buffer: PaintAction[], image: ImageData) {
    for (let action of buffer) {
      switch (action.type) {
        case PaintActionType.Draw: {
          for (let point of action.points) {
            this.drawPoint(point, action.brush, false, image);
          }
          break;
        }
        case PaintActionType.Erase: {
          for (let point of action.points) {
            this.drawPoint(point, action.brush, true, image);
          }
          break;
        }
        case PaintActionType.Fill: {
          let point = action.points[0][0];
          this.fill(
            point[0],
            point[1],
            action.brush.color,
            image
          );
          break;
        }
      }
    }

    this.hasReverted = true;
  }

  // Recreates the art canvas by going through undo buffer
  // and sending the last item of the undo buffer into
  // the redo buffer
  undo() {
    if (this.undoBuffer.length == 0)
      return;

    this.clear();

    let lastAction = this.undoBuffer.pop() as PaintAction;
    this.redoBuffer.push(lastAction);

    let imageData = this.getImageData();

    this.recreateBuffer(this.undoBuffer, imageData);

    this.context.putImageData(imageData, 0, 0);
    this.layer.batchDraw();
  }

  redo() {
    if (this.redoBuffer.length == 0)
      return;

    this.clear();

    let lastAction = this.redoBuffer.pop() as PaintAction;
    this.undoBuffer.push(lastAction);

    let imageData = this.getImageData();

    this.recreateBuffer(this.undoBuffer, imageData);

    this.context.putImageData(imageData, 0, 0);
    this.layer.batchDraw();
  }

  fill(x: number, y: number, newColor: string, image?: ImageData) {
    let width = this.layer.getWidth() as number;
    let height = this.layer.getHeight() as number;

    const isValidCoord = (x: number, y: number) => {
      return x >= 0 && x < width &&
        y >= 0 && y < height;
    };

    if (!isValidCoord(x, y)) {
      console.warn(`Passing in invalid coordinates: ${x}${y}`);
      return;
    }

    let imageData = image ?? this.getImageData();
    this.context.imageSmoothingEnabled = false;

    const isSameColor = (a: number[], b: number[], tolerance: number) => {
      const dr = Math.abs(a[0] - b[0]);
      const dg = Math.abs(a[1] - b[1]);
      const db = Math.abs(a[2] - b[2]);
      let res = (dr * dr + dg * dg + db * db) <= tolerance * tolerance;
      return res;
    };

    const getPixelColor = (x: number, y: number) => {
      let i = (y * width + x) * 4;
      return [
        imageData.data[i],
        imageData.data[i + 1],
        imageData.data[i + 2],
        imageData.data[i + 3],
      ];
    };

    const newColorRGB = this.hexToRGB(newColor);

    let oldColorRGB = getPixelColor(x, y);
    if (isSameColor(newColorRGB, oldColorRGB, 0)) {
      return;
    }

    const getSpan = (x: number, y: number) => {
      let start = 0;
      let end = width - 1;
      for (let startX = x; startX < width; ++startX) {
        const currentColorRGB = getPixelColor(startX, y);
        if (!isSameColor(currentColorRGB, oldColorRGB, 0)) {
          end = startX - 1
          break;
        }
      }
      for (let startX = x; startX >= 0; --startX) {
        const currentColorRGB = getPixelColor(startX, y);
        if (!isSameColor(currentColorRGB, oldColorRGB, 0)) {
          start = startX + 1;
          break;
        }
      }
      return [start, end, y];
    }

    let pixel_span: Array<[number, number]> = [];
    pixel_span.push([Math.floor(x), Math.floor(y)]);

    const checkPixelForSpan = (x: number, y: number, isInsideSpan: boolean) => {
      if (!isValidCoord(x, y)) {
        return [false, x];
      }

      let topPixelColor = getPixelColor(x, y);
      if (
        isSameColor(topPixelColor, oldColorRGB, 0) &&
        !isInsideSpan
      ) {
        let adjacentSpan = getSpan(x, y);
        pixel_span.push([x, y]);
        return [true, adjacentSpan[1]];
      }

      return [false, x];
    };

    while (pixel_span.length > 0) {
      let currentPixelCoord = pixel_span.pop() as [number, number];
      let currentSpan = getSpan(currentPixelCoord[0], currentPixelCoord[1]);

      // Used for checking adjacent rows to current row filled
      let isInsideSpan = false;

      let currentY = currentSpan[2];

      // Check above

      for (let currentX = currentSpan[0]; currentX <= currentSpan[1]; ++currentX) {
        let state = checkPixelForSpan(currentX, currentY - 1, isInsideSpan);
        isInsideSpan = state[0] as boolean;
        let newX = state[1] as number;
        if (newX < currentX) continue;
        currentX = newX;
      }

      isInsideSpan = false;

      // Check below

      for (let currentX = currentSpan[0]; currentX <= currentSpan[1]; ++currentX) {
        let state = checkPixelForSpan(currentX, currentY + 1, isInsideSpan);
        isInsideSpan = state[0] as boolean;
        let newX = state[1] as number;
        if (newX < currentX) continue;
        currentX = newX;
      }

      // Fill in current span

      for (let currentX = currentSpan[0]; currentX <= currentSpan[1]; ++currentX) {
        let i = (currentY * width + currentX) * 4;

        imageData.data[i] = newColorRGB[0];
        imageData.data[i + 1] = newColorRGB[1];
        imageData.data[i + 2] = newColorRGB[2];
        imageData.data[i + 3] = 255;
      }
    }

    if (image) return;

    this.context.putImageData(imageData, 0, 0);
    this.layer.batchDraw();
    this.hasFilled = true;

    let fillAction: PaintAction = {
      points: [[[x, y]]],
      type: PaintActionType.Fill,
      brush: { ...this.currentBrush }
    };

    this.undoBuffer.push(fillAction);
  }
}
