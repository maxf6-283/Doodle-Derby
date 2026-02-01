import Konva from "konva"

export interface Brush {
  // Hex (RGB) -- Ex: #FFFFFF
  color: string
  strokeWidth: number
}

export enum PaintActionType {
  Draw,
  Erase
}

// Array of tuples to construct a user's stroke
type PointsArray = [Konva.Vector2d, Konva.Vector2d][];

export interface PaintAction {
  // Array of connecting points
  points: PointsArray,
  type: PaintActionType,
  brush: Brush
}

export class PaintCanvas {
  private image: Konva.Image
  private layer: Konva.Layer
  private context: CanvasRenderingContext2D | null

  private _isErasing: boolean
  private currentBrush: Brush

  private undoBuffer: PaintAction[]
  private redoBuffer: PaintAction[]

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

    (this.context as CanvasRenderingContext2D).fillStyle = "#ffffff";
    this.context?.fillRect(0, 0, this.image.getWidth(), this.image.getHeight());

    this.currentBrush = brush;

    this._isErasing = false;

    this.undoBuffer = [];
    this.redoBuffer = [];

    let lastMousePos: Konva.Vector2d;
    let isPainting = false;

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

    const updateEraserState = () => {
      let context = this.context as CanvasRenderingContext2D;
      if (this.isErasing) {
        context.globalCompositeOperation = "destination-out";
      } else {
        context.globalCompositeOperation = "source-over";
      }
    }

    this.image.on('mousedown', () => {
      lastMousePos = stage.getPointerPosition() as Konva.Vector2d;
      isPainting = true;
      updateEraserState();

      paintAction.points = [];
      paintAction.brush = {
        ...this.currentBrush
      };
    });

    this.image.on('mouseup', () => {
      isPainting = false;

      this.drawPoint(
        lastMousePos,
        lastMousePos,
        brush,
        this.isErasing
      );

      paintAction.type =
        this.isErasing ?
          PaintActionType.Erase :
          PaintActionType.Draw;

      paintAction.points.push([
        lastMousePos,
        lastMousePos
      ]);

      this.redoBuffer = [];
      this.undoBuffer.push({ ...paintAction });
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

      updateEraserState();

      this.drawPoint(localPos, newLocalPos, brush, this.isErasing);

      paintAction.points.push([
        localPos,
        newLocalPos
      ]);

      lastMousePos = newLocalPos;
    });

    stage.add(this.layer);
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
    this.context?.clearRect(
      0,
      0,
      this.image.getWidth(),
      this.image.getHeight()
    );

    this.layer.batchDraw();
  }

  private drawPoint(
    pointA: Konva.Vector2d,
    pointB: Konva.Vector2d,
    brush: Brush,
    isErasing: boolean
  ) {
    if (this.context == null) {
      return;
    }

    let context = this.context as CanvasRenderingContext2D;

    if (isErasing) {
      context.globalCompositeOperation = "destination-out";
    } else {
      context.globalCompositeOperation = "source-over";
    }

    context.lineWidth = brush.strokeWidth;
    context.strokeStyle = brush.color;
    context.fillStyle = brush.color;
    context.lineJoin = "round";

    let radius = brush.strokeWidth;

    // The radius of the circle drawn doesn't always match
    // the stroke width leading to noticeable bulges at the tip
    // of lines. Halving the radius is arbitrary, but fixes the problem
    // while still being able to draw dots.
    if (radius > 1) {
      radius /= 2;
    }

    // Did the player click (drawing a dot),
    // or did they draw an actual line?
    let isDot: boolean = pointA == pointB;

    context.beginPath();

    if (isDot) {
      this.context?.arc(
        pointA.x,
        pointB.y,
        radius,
        0,
        Math.PI * 2
      );
    } else {
      this.context?.moveTo(pointA.x, pointA.y);
      this.context?.lineTo(pointB.x, pointB.y);
    }

    context.closePath();

    if (isDot)
      context.fill();
    else
      context.stroke();

    this.layer.batchDraw();
  }

  private recreateBuffer(buffer: PaintAction[]) {
    for (let action of buffer) {
      switch (action.type) {
        case PaintActionType.Draw: {
          for (let point of action.points) {
            this.drawPoint(point[0], point[1], action.brush, false);
          }
          break;
        }
        case PaintActionType.Erase: {
          for (let point of action.points) {
            this.drawPoint(point[0], point[1], action.brush, true);
          }
          break;
        }
      }
    }
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

    this.recreateBuffer(this.undoBuffer);
  }

  redo() {
    if (this.redoBuffer.length == 0)
      return;

    this.clear();

    let lastAction = this.redoBuffer.pop() as PaintAction;
    this.undoBuffer.push(lastAction);

    this.recreateBuffer(this.undoBuffer);
  }

  fill(x: number, y: number, newColor: string) {
    let width = this.layer.getWidth() as number;
    let height = this.layer.getHeight() as number;

    let imageData = this.context?.getImageData(0, 0, width, height) as ImageData;

    const isSameColor = (a: number[], b: number[], tolerance: number) => {
      return Math.abs(a[0] - b[0]) <= tolerance &&
        Math.abs(a[1] - b[1]) <= tolerance &&
        Math.abs(a[2] - b[2]) <= tolerance &&
        Math.abs(a[3] - b[3]) <= tolerance;
    };

    const hexToRGB = (hex: string) =>
      [
        parseInt(hex.substring(1, 3), 16),
        parseInt(hex.substring(3, 5), 16),
        parseInt(hex.substring(5, 7), 16),
        255
      ];

    const newColorRGB = hexToRGB(newColor);

    let pickedIndex = (y * width + x) * 4;
    const oldColorRGB = [
      imageData.data[pickedIndex],
      imageData.data[pickedIndex + 1],
      imageData.data[pickedIndex + 2],
      imageData.data[pickedIndex + 3],
    ];
    if (isSameColor(newColorRGB, oldColorRGB, 0)) {
      return;
    }

    console.log(oldColorRGB);

    let queue: Array<[number, number]> = [];
    let visited: Set<string> = new Set();

    let currentHead = 0;

    queue.push([x, y]);

    while (currentHead < queue.length) {
      let currentPixelCoord = queue[currentHead++];
      visited.add(`${currentPixelCoord[0]},${currentPixelCoord[1]}`);
      let i = (currentPixelCoord[1] * width + currentPixelCoord[0]) * 4;

      if (i < 0 || i >= width * height * 4) {
        continue;
      }

      let currentColor = [
        imageData.data[i],
        imageData.data[i + 1],
        imageData.data[i + 2],
        imageData.data[i + 3],
      ];


      if (!isSameColor(oldColorRGB, currentColor, 50)) {
        // console.log(oldColorRGB, currentColor);
        continue;
      }

      imageData.data[i] = newColorRGB[0];
      imageData.data[i + 1] = newColorRGB[1];
      imageData.data[i + 2] = newColorRGB[2];
      imageData.data[i + 3] = 255;

      const getColor = (x: number, y: number) => {
        let i = (y * width + x) * 4;

        return [
          imageData.data[i],
          imageData.data[i + 1],
          imageData.data[i + 2],
          imageData.data[i + 3],
        ];
      }

      const isValidCoord = (x: number, y: number) => {
        return x >= 0 &&
          x < width &&
          y >= 0 &&
          y < height &&
          !visited.has(`${x},${y}`) &&
          !isSameColor(getColor(x, y), newColorRGB, 50);
      };

      if (isValidCoord(currentPixelCoord[0] + 1, currentPixelCoord[1])) {
        queue.push([currentPixelCoord[0] + 1, currentPixelCoord[1]]);
      }
      if (isValidCoord(currentPixelCoord[0] - 1, currentPixelCoord[1])) {
        queue.push([currentPixelCoord[0] - 1, currentPixelCoord[1]]);
      }
      if (isValidCoord(currentPixelCoord[0], currentPixelCoord[1] + 1)) {
        queue.push([currentPixelCoord[0], currentPixelCoord[1] + 1]);
      }
      if (isValidCoord(currentPixelCoord[0], currentPixelCoord[1] - 1)) {
        queue.push([currentPixelCoord[0], currentPixelCoord[1] - 1]);
      }
    }

    this.context?.putImageData(imageData, 0, 0);
    this.layer.batchDraw();
  }
}
