import { Page } from "./page";
import { render } from "solid-js/web"
import { createSignal, onMount } from "solid-js";

import { getParticipants, PlayerState, me, isHost, RPC, getState, setState } from "playroomkit";

import konva from "konva";
import { PaintCanvas } from "./api/draw/painting"

// Functions here are throwaways and only serve as substitutes
const randInt = (length: number) => {
  return Math.floor(Math.random() * length);
}
function pickPrompts() {
  let firstArtistIndex = -1;
  let secondArtistIndex = -1;
  let participants = Object.values(getParticipants());
  participants.forEach((player, index) => {
    if (player.getState("isArtist") && firstArtistIndex < 0) {
      firstArtistIndex = index;
    } else if (player.getState("isArtist") && secondArtistIndex < 0) {
      secondArtistIndex = index;
    }
  });

  if (firstArtistIndex == secondArtistIndex || firstArtistIndex < 0 || secondArtistIndex < 0) {
    alert("Something went terribly wrong with picking prompts for artists!");
    return;
  }

  let firstWords: string[] = participants[firstArtistIndex].getState("words");
  let secondWords: string[] = participants[secondArtistIndex].getState("words");

  participants[secondArtistIndex].setState('prompt', firstWords[randInt(firstWords.length)].toLowerCase());
  participants[firstArtistIndex].setState('prompt', secondWords[randInt(secondWords.length)].toLowerCase());

  let promptList: string[] = [];
  promptList.push(participants[secondArtistIndex].getState('prompt'));
  promptList.push(participants[firstArtistIndex].getState('prompt'));

  setState('promptList', promptList);
}

function pickRandomArtists() {
  let availablePlayers: number[] = getState("availablePlayers");

  //Picking the first artist
  let random = randInt(availablePlayers.length);
  let firstArtistIndex: number = availablePlayers[random];
  availablePlayers.splice(random, 1);
  let participants = Object.values(getParticipants());

  //Picking the second artist
  let secondArtistIndex: number;
  if (availablePlayers.length == 0) {
    let secondRandom = firstArtistIndex;
    do {
      secondRandom = randInt(participants.length);
    } while (secondRandom == firstArtistIndex);
    secondArtistIndex = secondRandom;
  }
  else {
    random = randInt(availablePlayers.length);
    secondArtistIndex = availablePlayers[random];
    availablePlayers.splice(random, 1);
  }

  setState('availablePlayers', availablePlayers);

  participants.forEach((player: PlayerState) => {
    player.setState("isArtist", false)
  });
  participants[firstArtistIndex].setState("isArtist", true);
  participants[secondArtistIndex].setState("isArtist", true);
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

  let prompt: string = me().getState('prompt');

  return (
    <>
      <h1 style={{position: "fixed", right: "200px"}}>
        {prompt.toUpperCase()}
      </h1>
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

function findArtists() {
  let firstIndex = -1;
  let secondIndex = -1;
  let participants = Object.values(getParticipants());
  for (let i = 0; i < participants.length; i++) {
    if (firstIndex >= 0) {
      if (participants[i].getState('isArtist')) {
        secondIndex = i;
      }
    }
    else {
      if (participants[i].getState('isArtist')) {
        firstIndex = i;
      }
    }
  }
  return [firstIndex, secondIndex];
}

const SpectatorPage = () => {
  let [text, setText] = createSignal("");
  let [display, setDisplay] = createSignal("");
  let [isDisabled, setIsDisabled] = createSignal(false);
  let [guessedWords, setGuessedWords] = createSignal(new Array<string>());

  let promptSet: string[] = getState("promptList");
  console.log(promptSet);
  console.log(promptSet.keys());

  // let guessCounter = 0;
  let correctGuesses = 0;

  const guessChecker = () => {
    if (guessedWords().find((word) => word === text().toLowerCase())) {
      setDisplay(text() + " alr checked bruh");
    } else if (promptSet.find(word => word === text().toLowerCase())) {
      correctGuesses++;
      setGuessedWords((wordList: string[]) => {
        wordList.push(text().toLowerCase())
        return wordList;
      });
      setDisplay(text() + " is correct!");
    }
    if (correctGuesses >= 2) {
      setIsDisabled(true);
    }
  }


  return (
    <>
      <div>
        <h2>{display()}</h2>
      </div>
      <input disabled={isDisabled()} type="text" onChange={(c) => setText(text => text = c.currentTarget.value)} />
      <button onClick={guessChecker}>Submit</button>
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
      console.log(`my only prompt: ${currentPlayer.getState('prompt')}`);
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
      const participants: PlayerState[] = Object.values(getParticipants());
      let size = participants.length;
      let availablePlayers: number[] = [];
      for (let i = 0; i < size; i++) {
        availablePlayers.push(i);
      }
      setState("availablePlayers", availablePlayers);

      pickRandomArtists();
      pickPrompts();
      RPC.call('actualRender', {}, RPC.Mode.OTHERS);
      actualRender(root);
    }
  }
}
