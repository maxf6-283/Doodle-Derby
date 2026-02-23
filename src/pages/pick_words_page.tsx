import {
  getParticipants,
  isHost,
  myPlayer,
  RPC,
  setState,
  getState,
  PlayerState,
} from "playroomkit";

import { Page } from "../../api/page";
import { routerNavigate } from "../../api/tiny_router";
import { render } from "solid-js/web";
import { createSignal, For, onCleanup, onMount, Show } from "solid-js";

import "../../style/pick-words.css";

const MAX_WORDS = 1;

// Even though you can get the words completed
// through the player state, we must store a changing
// value in order to trigger a rerender of the component,
// because we end up storing the same player references
// every interval
interface PlayerStateWordInfo {
  player: PlayerState;
  wordsCompleted: number;
}

function PlayerCards() {
  const [playersList, setPlayersList] = createSignal<PlayerStateWordInfo[]>([]);
  onMount(() => {
    const interval = setInterval(() => {
      const players = Object.values(getParticipants());
      setPlayersList((previousPair) => {
        let newPair = players.map((player) => {
          let playerTuple: PlayerStateWordInfo = {
            player,
            wordsCompleted: player.getState("words_complete") ?? 0,
          };
          return playerTuple;
        });

        if (newPair.length != previousPair.length) {
          return newPair;
        }

        // If new pair matches old pair, then return old pair.
        // We don't want to trigger any rerenders.
        const same = previousPair.every(
          (player, i) => player.wordsCompleted === newPair[i].wordsCompleted,
          newPair,
        );

        return same ? previousPair : newPair;
      });
    }, 250);
    onCleanup(() => clearInterval(interval));
  });

  return (
    <div class="players-progress-list" id="players-progress-list">
      <For each={playersList()} fallback={<h1>Loading players...</h1>}>
        {({ player, wordsCompleted }) => {
          const name = player.getState("name") || "Guest";
          const characterImg = player.getState("character");
          const accessories: string[] = [
            player.getState("acc_0"),
            player.getState("acc_1"),
            player.getState("acc_2"),
          ].filter((a) => a);

          const words_complete = wordsCompleted;
          const progressPercent = (words_complete / MAX_WORDS) * 100;

          const card = document.createElement("div");
          card.className = "player-progress-card";

          return (
            <div class="player-progress-card">
              <span class="player-name-label">
                {" "}
                {name} {player.id === myPlayer().id ? "(You)" : ""}{" "}
              </span>
              <div class="player-icon-wrapper">
                <div class="mini-stick-man">
                  {characterImg ? (
                    <img src={`${characterImg}`} class="base-char" />
                  ) : (
                    "ツ"
                  )}
                  <For each={accessories}>
                    {(acc) => {
                      acc = acc.replace("/accessories/", "/accessories-equip/");
                      return <img src={acc} class="acc-layer" />;
                    }}
                  </For>
                </div>
              </div>
              <div class="progress-container-vertical">
                <div class="progress-bar-bg">
                  <div
                    class="progress-bar-fill"
                    style={`width: ${progressPercent}%`}
                  ></div>
                </div>
                <span class="progress-text">
                  {words_complete}/{MAX_WORDS}
                </span>
              </div>
            </div>
          );
        }}
      </For>
    </div>
  );
}

// Consolidated sync function to avoid repeated setState calls
// (NOTE) After rewrite, not sure if this still has intended effect
//        to avoid repeated setState calls
function syncState(words: string[]) {
  myPlayer().setState("words", [...words]);
  myPlayer().setState("words_complete", words.length);
}

function SubmitWord(props: {
  words: string[];
  pushWord: (word: string) => void;
}) {
  const [wordInput, setWordInput] = createSignal("");
  const [invalidInput, setInvalidInput] = createSignal(false);

  const submitWord = () => {
    const new_word = wordInput().trim();
    if (props.words.length < MAX_WORDS && new_word.length > 0) {
      props.pushWord(new_word);
      setWordInput("");
    } else {
      setInvalidInput((invalid) => (invalid = true));
      setTimeout(() => setInvalidInput((invalid) => (invalid = false)), 300);
    }
  };

  const onUpdateWord = (newWord: string) => {
    setWordInput(newWord);
  };

  return (
    <div class="input-group">
      <div>
        <input
          type="text"
          class={invalidInput() ? "error-shake" : ""}
          id="word-input"
          placeholder="Type a word..."
          value={wordInput()}
          onkeydown={(ev) => ev.key === "Enter" && submitWord()}
          onInput={(element) => onUpdateWord(element.currentTarget.value)}
        />

        <button id="add-word-btn" onClick={(_) => submitWord()}>
          <b>SUBMIT</b>
        </button>
      </div>
    </div>
  );
}

function WordsList(props: {
  words: string[];
  deleteWord: (word: number) => void;
}) {
  return (
    <div class="word-list-container" id="word-list">
      <For each={props.words}>
        {(word, index) => (
          <div class="word-item">
            <span>{word}</span>
            <button
              class="delete-btn"
              onClick={(_) => props.deleteWord(index())}
            >
              &times;
            </button>
          </div>
        )}
      </For>
    </div>
  );
}

function WaitingPage(props: { readyToStart: boolean }) {
  let [host, _] = createSignal(isHost());

  const onStart = () => {
    if (host() && !(getState("drawing-transition") ?? false)) {
      RPC.call("players-start-game", {}, RPC.Mode.OTHERS);
      routerNavigate("/game");
      setState("drawing-transition", true);
    }
  };

  return (
    <>
      <div id="waiting-screen" class="waiting-screen" style="flex">
        <h1 class="waiting-label" id="waiting-status-text">
          {
            // For more complex conditions, we should
            // avoid ternary bs
            !props.readyToStart || !host()
              ? !props.readyToStart
                ? "Waiting for other players..."
                : "Waiting for the Host to start..."
              : "Start Doodling!"
          }
        </h1>
        <PlayerCards />
      </div>

      <button
        id="start-game-btn"
        class="continue-btn"
        style={!props.readyToStart || !host() ? "display: none;" : "block"}
        onClick={(_) => onStart()}
      >
        START DOODLING!
      </button>
    </>
  );
}

function PickWordsMain() {
  const [wordsList, setWordsList] = createSignal(new Array<string>());
  const [isWaiting, setIsWaiting] = createSignal(false);
  const [allPlayersReady, setAllPlayersReady] = createSignal(false);

  onMount(() => {
    const startClean = RPC.register("players-start-game", async () => {
      routerNavigate("/game");
    });

    const readyClean = RPC.register("all-players-ready", async (_payload, _player) => {
      setAllPlayersReady(true);
    });

    const pickClean = RPC.register("player-picked-words", async (_payload, _player) => {
      const players = Object.values(getParticipants());
      const allFinished = players.every(
        (p) => p.getState("picked_words") === true,
      );

      if (allFinished) {
        // Tell everyone (including the host themselves) that we are ready
        RPC.call("all-players-ready", {}, RPC.Mode.ALL);
      }
    });

    myPlayer().setState("words", []);
    myPlayer().setState("words_complete", 0);
    myPlayer().setState("picked_words", false);

    onCleanup(() => {
      startClean();
      readyClean();
      pickClean();
    });
  });

  const deleteWord = (index: number) => {
    setWordsList((words) => {
      words.splice(index, 1);
      return [...words];
    });
    syncState(wordsList());
  };

  const pushWord = (word: string) => {
    setWordsList((words) => [...words, word]);
    syncState(wordsList());
  };

  const continueToWaiting = () => {
    setIsWaiting(true);
    myPlayer().setState("picked_words", true);
    RPC.call("player-picked-words", {}, RPC.Mode.HOST);
  };

  return (
    <Show
      when={!isWaiting()}
      fallback={<WaitingPage readyToStart={allPlayersReady()} />}
    >
      <div class="pick-words-container">
        <WordsList words={wordsList()} deleteWord={deleteWord} />
        <h1 class="input-label">
          <strong>WRITE ANYTHING...</strong>
        </h1>
        <SubmitWord words={wordsList()} pushWord={pushWord} />
      </div>
      // If this is greater than MAX_WORDS // something is wrong.
      <button
        id="continue-btn"
        class="continue-btn"
        style={
          wordsList().length >= MAX_WORDS
            ? wordsList().length.toString()
            : "display: none"
        }
        onClick={(_) => continueToWaiting()}
      >
        CONTINUE
      </button>
    </Show>
  );
}

export const PickWordsPage: Page = {
  async render(root: HTMLElement) {
    this.onEnd = render(() => <PickWordsMain />, root);
  },
};
