import { Page } from "../../api/page";
import { render } from "solid-js/web"
import { createSignal, onMount, Show } from "solid-js";

import { getParticipants, PlayerState, me, RPC, getState, setState, isHost } from "playroomkit";

import { ArtistCanvasComponent, SpectatorCanvas } from "../../api/draw/artist_canvas_component";

import "../../style/game.css";

// Functions here are throwaways and only serve as substitutes
const randInt = (length: number) => {
  return Math.floor(Math.random() * length);
};
function pickPrompts() {
  let participants = Object.values(getParticipants());
  let allWords: string[] = [];

  // Consolidate all words from all players
  participants.forEach((p) => {
    const words = p.getState("words") || [];
    allWords = [...allWords, ...words];
  });

  // Shuffle the pool
  allWords.sort(() => Math.random() - 0.5);

  participants.forEach((player) => {
    if (player.getState("isArtist")) {
      // Pick 2 unique words for this artist from the pool
      const choices = allWords.splice(0, 2);
      // Give the artist their choices via state
      player.setState("promptChoices", choices, true);
      // Clear any previous selection
      player.setState("prompt", "");
    }
  });

  // Update remaining global pool if needed for other logic
  setState("globalWordPool", allWords);
}

function pickRandomArtists() {
  let availablePlayers: number[] = getState("availablePlayers");

  if (availablePlayers.length == 0) {
    alert("Game is done! Refresh and restart to play again >:)");
    return;
  }

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
  } else {
    random = randInt(availablePlayers.length);
    secondArtistIndex = availablePlayers[random];
    availablePlayers.splice(random, 1);
  }

  setState("availablePlayers", availablePlayers);

  participants.forEach((player: PlayerState) => {
    player.setState("isArtist", false);
  });
  participants[firstArtistIndex].setState("isArtist", true);
  participants[secondArtistIndex].setState("isArtist", true);
}

// This is very hacky! Let's change this as soon as possible!!!

let intervalId: NodeJS.Timeout;

const DrawPage = () => {
  let container: HTMLDivElement | undefined;
  let canvas: HTMLCanvasElement | undefined;
  let small_button: HTMLInputElement | undefined;
  let med_button: HTMLInputElement | undefined;
  let large_button: HTMLInputElement | undefined;
  let color_button: HTMLInputElement | undefined;
  const [hasSelectedWord, setHasSelectedWord] = createSignal(
    !!me().getState("prompt"),
  );

  createEffect(() => {
    // Only run if the word is selected and the elements actually exist in DOM
    if (hasSelectedWord() && container && canvas) {
      let stage = new konva.Stage({
        container: container,
        width: 600,
        height: 600,
      });

      canvas.width = stage.width();
      canvas.height = stage.height();

      let paint = new PaintCanvas(canvas, { x: 0, y: 0 }, stage, {
        color: "#000000",
        strokeWidth: 5,
      });

      function changeBrushSize(size: number) {
        paint.setBrushStrokeWidth(size);
      }

      function changeColor(color: string) {
        console.log("In change colour ", color);
        paint.setBrushColor(color);
      }

      // Set up intervals for syncing drawing
      const syncInterval = setInterval(() => {
        const url = canvas!.toDataURL();
        RPC.call("canvasChange", { data: url }, RPC.Mode.OTHERS);
      }, 300);

      // Add your event listeners here (small_button, med_button, etc.)
      small_button?.addEventListener("click", () => changeBrushSize(5));
      med_button?.addEventListener("click", () => changeBrushSize(20));
      large_button?.addEventListener("click", () => changeBrushSize(30));
      color_button?.addEventListener("input", () =>
        changeColor(color_button.value),
      );

      window.addEventListener("keydown", (ev) => {
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

      onCleanup(() => {
        clearInterval(syncInterval);
        stage.destroy(); // Clean up Konva stage on unmount
      });
    }
  });

  

  const prompt = () => me().getState("prompt") || "";

  return (
    <>
      <Show when={!hasSelectedWord()}>
        <RandomWordSelection onSelected={() => setHasSelectedWord(true)} />
      </Show>
      <Show when={hasSelectedWord()}>
        <h1 style={{ position: "fixed", right: "200px" }}>
          {prompt().toUpperCase()}
        </h1>
        <div ref={container} id="container">
          <canvas ref={canvas} />
        </div>
        <div class="sidebar" id="sidebar">
          <input type="button" ref={small_button} value="Small" />
          <input type="button" ref={med_button} value="Medium" />
          <input type="button" ref={large_button} value="Large" />
          <input type="color" ref={color_button} />
        </div>
      </Show>
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
};

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
    } else if (promptSet.find((word) => word === text().toLowerCase())) {
      correctGuesses++;
      if (correctGuesses == 2) {
        RPC.call("playerGuessed", {}, RPC.Mode.HOST);
      }
      setGuessedWords((wordList: string[]) => {
        wordList.push(text().toLowerCase());
        return wordList;
      });
      setDisplay(text() + " is correct!");
    }
    if (correctGuesses >= 2) {
      setIsDisabled(true);
    }
  };

  return (
    <>
      <div>
        <h2>{display()}</h2>
      </div>
      <input
        disabled={isDisabled()}
        type="text"
        onChange={(c) => setText((text) => (text = c.currentTarget.value))}
      />
      <button onClick={guessChecker}>Submit</button>
    </>
  );
};

function DrawImages(props: { drawCanvases: Map<string, string> }) {
  return (
    <ul
      style={{ display: "flex", gap: "16px", padding: 0, "list-style": "none" }}
    >
      {Array.from(props.drawCanvases.entries()).map(([name, data]) => (
        <li
          style={{
            display: "flex",
            "align-items": "center",
            "flex-direction": "column",
          }}
        >
          <span>{name}</span>
          <img
            src={data}
            style={{
              width: "120px",
              height: "120px",
              "object-fit": "contain",
              border: "1px solid #ccc",
            }}
          />
        </li>
      ))}
    </ul>
  );
}

function GameplayPageMain() {
  let [hostId, setHostId] = createSignal("");
  onMount(() => {
    RPC.register("setHostId", async (payload: string, _) => {
      console.log(payload, "set");
      setHostId(payload);
    });
    if (isHost()) {
      RPC.call("setHostId", me().id, RPC.Mode.ALL);
    }
  });

  return (
    <div>
      <h1>This is the Gameplay Page</h1>
      <Show when={isHost()}>
        <ArtistCanvasComponent />
      </Show>

      <Show when={!isHost()}>
        <div style={{ display: 'flex', "justify-content": 'center', "align-items": 'center', width: '100%', height: '100%' }}>
          <SpectatorCanvas artistId={hostId()} />
        </div>
      </Show>
    </div>
  );
}

export const GameplayPage: Page = {
  render(root: HTMLElement) {
    RPC.register("actualRender", async () => actualRender(root));
    RPC.register("playerGuessed", async () => {
      if (!isHost()) return;
      setState("playersGuessed", getState("playersGuessed") + 1);
      const guessersSize = Object.values(getParticipants()).length - 2;
      if (getState("playersGuessed") == guessersSize) {
        RPC.call("startNewLoop", {}, RPC.Mode.HOST);
      }
    });
    RPC.register("dumpRender", async () => {
      if (disposeSolid == null) {
        console.error("this shouldn't be null!!!");
        return;
      }
      console.log("solid disposed. start new loop");
      disposeSolid();
      actualRender(root);
    });
    RPC.register("startNewLoop", async () => {
      if (isHost()) {
        console.log("called loop");
        pickRandomArtists();
        pickPrompts();
        setState("playersGuessed", 0);
        RPC.call("dumpRender", {}, RPC.Mode.ALL);
      }
    });

    if (isHost()) {
      const participants: PlayerState[] = Object.values(getParticipants());
      let size = participants.length;
      let availablePlayers: number[] = [];
      for (let i = 0; i < size; i++) {
        availablePlayers.push(i);
      }

      setState("playersGuessed", 0);
      setState("availablePlayers", availablePlayers);

      pickRandomArtists();
      pickPrompts();
      RPC.call("actualRender", {}, RPC.Mode.OTHERS);
      actualRender(root);
    }
  },
};

export function RandomWordSelection(props: {
  onSelected: (word: string) => void;
}) {
  const [choices] = createSignal<string[]>(
    me().getState("promptChoices") || [],
  );
  const [selected, setSelected] = createSignal<string | null>(null);

  const handleSelect = (word: string) => {
    setSelected(word);
    // Set the official prompt on the player state
    me().setState("prompt", word, true);
    props.onSelected(word);
  };

  return (
    <Show when={!selected()}>
      <div class="selection-overlay">
        <div class="selection-card">
          <h2>CHOOSE YOUR PROMPT</h2>
          <div class="choices-container">
            <For each={choices()}>
              {(word) => (
                <button
                  class="word-choice-btn"
                  onClick={() => handleSelect(word)}
                >
                  {word.toUpperCase()}
                </button>
              )}
            </For>
          </div>
        </div>
      </div>

      <style>{`
        .selection-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0,0,0,0.85);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .selection-card {
          background: white;
          padding: 2rem;
          border-radius: 15px;
          text-align: center;
          border: 4px solid #333;
        }
        .choices-container {
          display: flex;
          gap: 20px;
          margin-top: 20px;
          justify-content: center;
        }
        .word-choice-btn {
          padding: 15px 30px;
          font-size: 1.5rem;
          cursor: pointer;
          background: #ffcf00;
          border: 3px solid black;
          font-weight: bold;
          transition: transform 0.1s;
        }
        .word-choice-btn:hover {
          transform: scale(1.05);
          background: #ffe054;
        }
      `}</style>
    </Show>
  );
}
