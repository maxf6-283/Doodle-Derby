import { Page } from "../../api/page";
import { render } from "solid-js/web"
import { createSignal, onMount, onCleanup } from "solid-js";

import { getParticipants, PlayerState, me, isHost, RPC, getState, setState } from "playroomkit";

import { ArtistCanvasComponent } from "../../api/draw/artist_canvas_component";

import "../../style/game.css"

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

let intervalId: NodeJS.Timeout

const DrawPage = () => {
  let container: HTMLDivElement | undefined;
  let canvas: HTMLCanvasElement | undefined;
  let small_button: HTMLInputElement | undefined;
  let med_button: HTMLInputElement | undefined;
  let large_button: HTMLInputElement | undefined;
  let color_button: HTMLInputElement | undefined;

  onMount(() => {
  });

  let prompt: string = me().getState('prompt');

  return (
    <>
      <h1 style={{ position: "fixed", right: "200px" }}>
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
      if (correctGuesses == 2) {
        RPC.call('playerGuessed', {}, RPC.Mode.HOST);
      }
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
                  width: "120px",
                  height: "120px",
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

function GameplayPageMain() {
  return (
    <div>
      <h1>This is the Gameplay Page</h1>
      <ArtistCanvasComponent />
    </div>
  );
}

export const GameplayPage: Page = {
  render(root: HTMLElement) {
    render(() => (<GameplayPageMain />), root);
  }
}
