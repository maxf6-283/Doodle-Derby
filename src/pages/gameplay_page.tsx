import { Page } from "../../api/page";
import { render, For } from "solid-js/web";
import { createSignal, onCleanup, onMount, Show } from "solid-js";
import { ChatGuesser, GuessElement } from "../../api/guess/GuessComponent";

import {
  getParticipants,
  PlayerState,
  me,
  RPC,
  setState,
  isHost,
  getState,
} from "playroomkit";

import {
  ArtistCanvasComponent,
  SpectatorCanvas,
} from "../../api/draw/ArtistCanvasComponent";

import { ReactionBar } from "../../api/reactions/ReactionBarComponent";

import "../../style/game.css";
import { AudioManager } from "../components/AudioManager";
import { routerNavigate } from "../../api/tiny_router";
import { PlayerList } from "../components/PlayerList";
import { MuteButton } from "../components/MuteButton";

// Functions here are throwaways and only serve as substitutes
const randInt = (length: number) => {
  return Math.floor(Math.random() * length);
};

function pickPrompts() {
  let participants = Object.values(getParticipants());

  let artists: PlayerState[] = [];
  let artistChoices: Map<string, string[]> = new Map();

  participants.forEach((player) => {
    if (player.getState("isArtist")) {
      artists.push(player);

      let wordPool: string[] = player.getState("words");
      wordPool.sort(() => Math.random() - 0.5);
      const choices = wordPool.splice(0, 2);
      artistChoices.set(player.id, [...choices]);

      player.setState("words", wordPool, true);
    }
  });

  // These will exist!!! They will not be
  // undefined!!!

  let firstArtist = artists[0];
  let firstArtistPrompts = artistChoices.get(firstArtist.id) as string[];
  let secondArtist = artists[1];
  let secondArtistPrompts = artistChoices.get(secondArtist.id) as string[];

  // Give the artist their choices via state
  firstArtist.setState("promptChoices", secondArtistPrompts, true);
  firstArtist.setState("prompt", "");

  secondArtist.setState("promptChoices", firstArtistPrompts, true);
  secondArtist.setState("prompt", "");
}

function pickRandomArtists() {
  let participants = Object.values(getParticipants());
  let currentArtistPool = participants.filter((player) => {
    player.setState("isArtist", false);
    return !player.getState("hasChosen");
  });

  if (currentArtistPool.length == 0) {
    let roundsPlayed = getState("roundsPlayed") + 1;
    let maxRounds = getState("number-rounds");

    console.log("end state:", roundsPlayed, maxRounds);
    // Check if greater just in case,
    // but ideally it should never be greater
    if (roundsPlayed >= maxRounds) {
      RPC.call("gameFinished", {}, RPC.Mode.ALL);
      return;
    }

    setState("roundsPlayed", roundsPlayed, true);

    // Reset player pool

    participants.forEach((player) => {
      player.setState("hasChosen", false);
    });

    currentArtistPool = participants.filter((player) => {
      player.setState("isArtist", false);
      return !player.getState("hasChosen");
    });
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
      console.log("picked prompt!");
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
      <Show when={isArtist()} fallback={<h1>Waiting for artists to pick prompt!</h1>}>
        <RandomWordSelection onSelected={() => RPC.call("pickedPrompt", {}, RPC.Mode.ALL)} />
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
          <h1 class="round-header">Round {getState("roundsPlayed") || 0}</h1>
          <Show when={props.otherArtist}>
            <SpectatorCanvas artist={props.otherArtist} scale={0.4} />
          </Show>
          <ChatGuesser promptList={[]} artists={[]} notArtist={false} />
          <ReactionBar />
        </div>
        <div
          style={{
            display: "flex",
            "flex-direction": "column",
            "justify-content": "flex-start",
          }}
        >
          <div style={{ display: "flex", "justify-content": "flex-end" }}>
            <MuteButton
              onClick={() => {
                if (!AudioManager.isMuted())
                  AudioManager.playLoop("/audio/DDsong.mp3");
              }}
            ></MuteButton>
          </div>
          <PlayerList></PlayerList>
        </div>
      </div>
    </>
  );
}

function SpectatorPage(props: { artistList: PlayerState[] }) {
  let [prompts, setPrompts] = createSignal<string[]>([]);
  let [hiddenPrompts, setHiddenPrompts] = createSignal<string[]>([]);

  const hangman = (prompt: string) => {
    let hidden = "";
    for (let i = 0; i < prompt.length; i++) {
      if (prompt.charAt(i) === " ") {
        hidden += " ";
      } else {
        hidden += "_";
      }
      hidden += " ";
    }
    return hidden;
  };

  onMount(() => {
    setPrompts([
      props.artistList[0].getState("prompt"),
      props.artistList[1].getState("prompt"),
    ]);
    setHiddenPrompts([hangman(prompts()[0]), hangman(prompts()[1])]);
  });

  return (
    <Show when={props.artistList.length >= 2}>
      <>
        {/* <><SpectatorCanvas artist={item}</> */}
        <div class="spectator-page-container">
          <div class="audience-canvas-container">
            <SpectatorCanvas
              artist={props.artistList[0]}
              hiddenPrompt={hiddenPrompts()[0]}
              scale={0.7}
            ></SpectatorCanvas>
          </div>
          <div class="audience-canvas-container">
            <SpectatorCanvas
              artist={props.artistList[1]}
              hiddenPrompt={hiddenPrompts()[1]}
              scale={0.7}
            ></SpectatorCanvas>
          </div>
          <div class="spectator-info-container">
            <div style={{ display: "flex", "justify-content": "flex-end" }}>
              <MuteButton
                onClick={() => {
                  if (!AudioManager.isMuted())
                    AudioManager.playLoop("/audio/DDsong.mp3");
                }}
              ></MuteButton>
            </div>

            <ChatGuesser
              promptList={prompts()}
              artists={props.artistList}
              notArtist={true}
            />
            <ReactionBar></ReactionBar>
          </div>
        </div>
      </>
    </Show>
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
    <>
      <Show when={!gameStarted()} fallback={<Gameplay />}>
        <SelectPrompts onPromptsPicked={() => setIsGameStarted(true)} />
      </Show>
    </>
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
    <Show when={!selected()}
  fallback={
  <div class="waiting-screen">
    <img src="/sheep_thinking.gif" alt="thinking sheep" class="waiting-sheep" />
    <div class="waiting-content">
      <p class="waiting-label">Waiting for other artist</p>
        </div>
        </div>
  }
>
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
