import { getParticipants, getRoomCode, getState, isHost, myPlayer, RPC, setState } from "playroomkit";

import { Page } from "./page"
import { routerNavigate } from "./tiny_router";

const MAX_WORDS = 10;

const PICK_TIME = 30;

export default function mount() {
  const code_span = document.getElementById("code-span") as HTMLSpanElement;
  const settingsBtn = document.getElementById(
    "settings-btn",
  ) as HTMLButtonElement;
  const players_list = document.getElementById("players-list") as HTMLDivElement;
  const word_input = document.getElementById("word-input") as HTMLInputElement;
  const word_list = document.getElementById("word-list") as HTMLDivElement;
  const done = document.getElementById("done") as HTMLButtonElement;
  const timer = document.getElementById("timer") as HTMLSpanElement;

  let my_words: string[] = [];
  let timerId: number | null = null

  function updateUI() {
    code_span.innerText = getRoomCode() ?? "Error";

    const players = Object.values(getParticipants());

    players_list.innerHTML = ""

    for (let player of players) {
      const words_complete = player.getState("words_complete") ?? 0;
      const name = player.getState("name") ?? "Unnammed Player";
      const character = player.getState("character")

      const playerDiv = document.createElement("div")

      const image = document.createElement("img")
      image.src = character
      image.width = 100
      image.height = 100
      playerDiv.append(image)

      playerDiv.append(name + ` ${words_complete}/${MAX_WORDS}`)

      players_list.append(playerDiv)
    }

    let seconds = getState("seconds-remaining")
    if (isHost() && seconds == undefined) {
      setState("seconds-remaining", PICK_TIME)
      timerId = window.setInterval(() => {
        let seconds_remaining = getState("seconds-remaining") - 1
        if (seconds_remaining <= 0) {
          RPC.call("writing-timeout", {}, RPC.Mode.ALL)
        } else {
          setState("seconds-remaining", seconds_remaining)
        }
      }, 1000)
    }
    seconds ??= PICK_TIME
    let minutes = Math.floor(seconds / 60)
    seconds %= 60
    timer.innerText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  }

  function updateWords() {
    myPlayer().setState("words", my_words)
    myPlayer().setState("words_complete", my_words.length)
  }

  word_input.addEventListener("keydown", (ev) => {
    if (ev.key == "Enter") {
      if (my_words.length < 10) {
        const idx = my_words.length
        const new_word = word_input.value
        my_words.push(new_word)
        word_input.value = ""
        updateWords()

        const wordDiv = document.createElement("div");

        const changeWord = document.createElement("input")
        changeWord.type = "text"
        changeWord.value = new_word
        changeWord.addEventListener("change", ev => {
          my_words[idx] = changeWord.value
          updateWords()
        })
        wordDiv.append(changeWord)

        word_list.append(wordDiv)

        if (my_words.length == 10) {
          done.disabled = false;
        }
      }
    }
  }
  )

  const updateId = window.setInterval(updateUI, 250)

  done.addEventListener("click", () => {
    clearInterval(updateId)
    routerNavigate("/waiting")
  })

  RPC.register("writing-timeout", async (_payload, _player) => {
    clearInterval(updateId)
    if (timerId != null) clearInterval(timerId)
    alert("Game starting!!!")
  })
}

export const PickWordsPage: Page = {
  async render(root: HTMLElement) {
    const html = await fetch("pick-words.html").then(r => r.text());
    root.innerHTML = html;
    mount();
  }
}
