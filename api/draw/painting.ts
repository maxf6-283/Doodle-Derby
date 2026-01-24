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
      brush: this.currentBrush
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
      paintAction.brush = this.currentBrush;
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

    context.lineWidth = this.currentBrush.strokeWidth;
    context.strokeStyle = this.currentBrush.color;
    context.fillStyle = this.currentBrush.color;
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
}
