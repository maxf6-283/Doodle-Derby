import { Page } from "./page";
import { render } from "solid-js/web"
import { createSignal, onMount } from "solid-js";

import { getParticipants, PlayerState, me, isHost, RPC } from "playroomkit";

import konva from "konva";
import { PaintCanvas } from "./api/draw/painting"

// Functions here are throwaways and only serve as substitutes

function pickRandomArtists() {
  const participants: PlayerState[] = Object.values(getParticipants());
  let size = participants.length;

  const randInt = () => {
    return Math.floor(Math.random() * size);
  }

  let firstIndex = randInt();
  let secondIndex = 0;
  do {
    secondIndex = randInt();
  } while (secondIndex == firstIndex);

  if (firstIndex < 0 || firstIndex >= size ||
    secondIndex < 0 || secondIndex >= size ||
    firstIndex == secondIndex) {
    alert("bruh picking random artists went wrong...");
  }

  participants.forEach((player: PlayerState) => player.setState("isArtist", false));

  participants[firstIndex].setState("isArtist", true);
  participants[secondIndex].setState("isArtist", true);

}

// This is very hacky! Let's change this as soon as possible!!!

const DrawPage = () => {
  let container: HTMLDivElement | undefined;
  let canvas: HTMLCanvasElement | undefined;
  let small_button: HTMLInputElement | undefined;
  let med_button: HTMLInputElement | undefined;
  let large_button: HTMLInputElement | undefined;
  let color_button: HTMLInputElement | undefined;

  onMount(() => {
    let stage = new konva.Stage({
      container,
      width: 600,
      height: 600
    });

    if (canvas == null) return;

    canvas.width = stage.width();
    canvas.height = stage.height();

    let paint = new PaintCanvas(
      canvas,
      { x: 0, y: 0 },
      stage,
      { color: "#000000", strokeWidth: 5 }
    );

    function changeBrushSize(size: number) {
      paint.setBrushStrokeWidth(size);
    }

    function changeColor(color: string) {
      console.log("In change colour ", color);
      paint.setBrushColor(color);
    }

    setInterval(() => {
      const url = canvas.toDataURL();
      RPC.call("canvasChange", { data: url }, RPC.Mode.OTHERS);
    }, 300);

    small_button?.addEventListener('click', () => changeBrushSize(5));
    med_button?.addEventListener('click', () => changeBrushSize(20));
    large_button?.addEventListener('click', () => changeBrushSize(30));
    color_button?.addEventListener('input', () => changeColor(color_button.value));


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

      if (ev.key == "f") {
        let x = stage.pointerPos?.x as number;
        let y = stage.pointerPos?.y as number;
        paint.fill(Math.floor(x), Math.floor(y), paint.brushColor);
      }
    });
  });

  return (
    <>
      <div ref={container} id='container'>
        <canvas ref={canvas} />
      </div>
      <div class="sidebar" id="sidebar">
        <input type="button" ref={small_button} value="Small" />
        <input type="button" ref={med_button} value="Medium" />
        <input type="button" ref={large_button} value="Large" />
        <input type="color" ref={color_button} />
      </div>
      <style>
        {`
        .sidebar {
          position: fixed;
        left: 5%;
        background-color: #666666;
        padding: 5px;
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

const SpectatorPage = () => {
  let [text, setText] = createSignal("");
  return (
    <>
      <h1>{text()}</h1>
      <input type="text" onChange={(c) => setText(text => text = c.currentTarget.value)} />
    </>
  );
}

function DrawImages(props: { drawCanvases: Map<string, string> }) {
  return (
    <ul style={{ display: "flex", gap: "16px", padding: 0, "list-style": "none" }}>
      {
        Array.from(props.drawCanvases.entries()).map(([name, data]) =>
        (
          <li style={{ display: "flex", "align-items": "center", "flex-direction": "column" }}>
            <span>{name}</span>
            <img
              src={data}
              style={
                {
                  width: "250px",
                  height: "250px",
                  "object-fit": "contain",
                  border: "1px solid #ccc"
                }
              }
            />
          </li>
        )
        )
      }
    </ul>);
}

function actualRender(root: HTMLElement) {
  const currentPlayer = me();
  const Dummy = () => {
    let isArtist: boolean = currentPlayer.getState("isArtist") ?? false;

    const [drawCanvases, setDrawCanvases] = createSignal(new Map<string, string>())

    RPC.register('canvasChange', async (payload, player) => {
      let name = player.getState('name');
      setDrawCanvases(previous => {
        const newMap = new Map(previous);
        newMap.set(name, payload.data);
        return newMap;
      });
    });

    if (isArtist) {
      return (
        <div style={{ display: "flex", "gap": "1rem" }}>
          <DrawImages drawCanvases={
            new Map(drawCanvases().entries().filter((v, _) => v[0] !== me().getState('name')))
          } />
          <DrawPage />
        </div>
      );
    }

    return (
      <div style={{ display: "flex", "flex-direction": "column", gap: "24px" }}>
        <DrawImages drawCanvases={drawCanvases()} />
        <SpectatorPage />
      </div>
    )
  };

  render(() => (<Dummy />), root);
}

//

export const GameplayPage: Page = {
  render(root: HTMLElement) {
    RPC.register('actualRender', async () => actualRender(root));
    if (isHost()) {
      pickRandomArtists();
      RPC.call('actualRender', {}, RPC.Mode.OTHERS);
      actualRender(root);
    }
  }
}
