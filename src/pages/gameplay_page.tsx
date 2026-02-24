import { Page } from "../../api/page";
import { render, For } from "solid-js/web";
import { createSignal, onCleanup, onMount, Show } from "solid-js";
import { ChatGuesser } from "../../api/guess/GuessComponent";

import {
  getParticipants,
  PlayerState,
  me,
  RPC,
  setState,
  isHost,
} from "playroomkit";

import {
  ArtistCanvasComponent,
  SpectatorCanvas,
} from "../../api/draw/ArtistCanvasComponent";

import "../../style/game.css";
import { AudioManager } from "../components/AudioManager";
import { routerNavigate } from "../../api/tiny_router";
import { PlayerList } from "../components/PlayerList";

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
  let participants = Object.values(getParticipants());
  let currentArtistPool = participants.filter((player) => {
    player.setState("isArtist", false);
    return !player.getState("hasChosen");
  });

  console.log("artist pool:", currentArtistPool.length);

  if (currentArtistPool.length == 0) {
    RPC.call("gameFinished", {}, RPC.Mode.ALL);
    return;
  }

  let firstIndex = randInt(currentArtistPool.length);
  currentArtistPool[firstIndex].setState("isArtist", true);
  currentArtistPool[firstIndex].setState("hasChosen", true);

  let secondIndex = firstIndex;
  if (currentArtistPool.length == 1) {
    let secondIndex = randInt(participants.length);
    while (participants[secondIndex].id === currentArtistPool[firstIndex].id) {
      secondIndex = randInt(participants.length);
    }
    console.log("We chose", participants[secondIndex].getState("name"));
    participants[secondIndex].setState("isArtist", true, true);
    participants[secondIndex].setState("hasChosen", true, true);
  } else {
    do {
      secondIndex = randInt(currentArtistPool.length);
    } while (secondIndex == firstIndex);
    currentArtistPool[secondIndex].setState("isArtist", true, true);
    currentArtistPool[secondIndex].setState("hasChosen", true, true);
  }
}

function SelectPrompts(props: { onPromptsPicked: () => void }) {
  let [isArtist, setIsArtist] = createSignal(false);
  let [numPromptsPicked, setNumPromptsPicked] = createSignal(0);

  onMount(() => {
    const pickedPromptClean = RPC.register("pickedPrompt", async () => {
      setNumPromptsPicked((n) => n + 1);
      if (numPromptsPicked() >= 2) {
        props.onPromptsPicked();
      }
    });

    const randomArtistsClean = RPC.register("randomArtistsPicked", async () => {
      setIsArtist(me().getState("isArtist"));
    });

    onCleanup(() => {
      pickedPromptClean();
      randomArtistsClean();
    });
  });

  return (
    <>
      <Show
        when={isArtist()}
        fallback={<h1>Waiting for artists to pick prompt!</h1>}
      >
        <RandomWordSelection
          onSelected={() => RPC.call("pickedPrompt", {}, RPC.Mode.ALL)}
        />
      </Show>
    </>
  );
}

function ArtistPage(props: { otherArtist: PlayerState }) {
  return (
    <>
      <div class="artist-container">
        <div>
          <ArtistCanvasComponent prompt={me().getState("prompt")} />
          {/* Color pallete here??? */}
        </div>
        <div class="game-info-container">
          <SpectatorCanvas artist={props.otherArtist} scale={0.4} />
          {/* {chat box here!} */}
        </div>
        <div>
          <PlayerList></PlayerList>
        </div>
        
      </div>
    </>
  );
}

function SpectatorPage(props: { artistList: PlayerState[] }) {
  let [prompts, setPrompts] = createSignal<string[]>([]);

  onMount(() => {
    setPrompts([
      props.artistList[0].getState("prompt"),
      props.artistList[1].getState("prompt"),
    ]);
  });

  return (
    <>
      <div style={{ display: "flex", gap: "1rem" }}>
        <For each={props.artistList}>
          {(item) => <SpectatorCanvas artist={item} />}
        </For>
      </div>
      <ChatGuesser promptList={prompts()} artists={props.artistList} />
    </>
  );
}

function Gameplay() {
  let [artists, setArtists] = createSignal<PlayerState[]>([]);
  let [isArtist, setIsArtist] = createSignal(false);
  let [numPlayersGuessed, setNumPlayersGuessed] = createSignal(0);

  onMount(() => {
    let participants = Object.values(getParticipants());
    participants = participants.filter((player) => player.getState("isArtist"));

    if (isHost()) {
      console.log("players guessed:", numPlayersGuessed());
    }

    setIsArtist(me().getState("isArtist") ?? false);

    if (me().getState("isArtist")) {
      participants = participants.filter((player) => player.id !== me().id);
    }
    setArtists(participants);

    const nextRoundClean = RPC.register("nextRound", async () => {
      console.log("next round!!!");
      setState("chats", [], true);
      routerNavigate("/game");
    });

    const playerGuessedClean = RPC.register("playerGuessed", async () => {
      let guesserCount = Object.values(getParticipants()).length - 2;
      setNumPlayersGuessed((previousNum) => {
        let newNum = previousNum + 1;
        if (newNum >= guesserCount) {
          RPC.call("nextRound", {}, RPC.Mode.ALL);
        }
        return newNum;
      });
    });

    onCleanup(() => {
      nextRoundClean();
      playerGuessedClean();
    });
  });

  return (
    <>
      <Show when={isArtist()}>
        <ArtistPage otherArtist={artists()[0]} />
      </Show>

      <Show when={!isArtist()}>
        <SpectatorPage artistList={artists()} />
      </Show>
    </>
  );
}

function GameplayPageMain() {
  let [gameStarted, setIsGameStarted] = createSignal(false);

  onMount(() => {
    const gameFinishedClean = RPC.register("gameFinished", async () => {
      routerNavigate("/podium-page");
    });

    me().setState("rightGuesses", 0);

    if (isHost()) {
      let participants: PlayerState[] = Object.values(getParticipants());

      participants.forEach((player) => {
        // Only set the score to 0 on initial run.
        // Do not want to reset between rounds.
        if (!player.getState("score")) {
          player.setState("score", 0);
        }
      });

      participants.forEach((player) => {
        // Only set hasChosen to false on initial run.
        // Do not want to reset between rounds.
        // This determines the player pool of people who
        // haven't drawn yet.
        if (!player.getState("hasChosen")) {
          player.setState("hasChosen", false);
        }

        player.setState("isArtist", false);
      });

      console.log("we doin this again");

      pickRandomArtists();
      pickPrompts();

      RPC.call("randomArtistsPicked", {}, RPC.Mode.ALL);
    }

    onCleanup(() => {
      gameFinishedClean();
    });
  });

  return (
    <Show when={!gameStarted()} fallback={<Gameplay />}>
      <SelectPrompts onPromptsPicked={() => setIsGameStarted(true)} />
    </Show>
  );
}

export const GameplayPage: Page = {
  render(root: HTMLElement) {
    this.onEnd = render(() => <GameplayPageMain />, root);
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
    me().setState("prompt", word.toLowerCase(), true);
    props.onSelected(word);
  };

  return (
    <Show when={!selected()} fallback={<h1> Waiting for other Artist... </h1>}>
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
