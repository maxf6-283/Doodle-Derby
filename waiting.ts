import { getParticipants, myPlayer, getRoomCode, getState } from "playroomkit";

import { Page } from "./api/page";
import { routerNavigate } from "./api/tiny_router";

const MAX_WORDS = 10
const PICK_TIME = 30

export default function mount() {
  const code_span = document.getElementById("code-span") as HTMLSpanElement;
  const settingsBtn = document.getElementById(
    "settings-btn",
  );
  const players_list = document.getElementById("player-list") as HTMLDivElement;
  const timer = document.getElementById("timer") as HTMLSpanElement;

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

    let seconds = getState("seconds-remaining") ?? PICK_TIME
    let minutes = Math.floor(seconds / 60)
    seconds %= 60

    // TODO: CLEAN THIS UP MAYBE?
    if (timer == null) return;
    timer.innerText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  }

  window.setInterval(updateUI, 250)
}

export const WaitingPage: Page = {
  async render(root: HTMLElement) {
    const html = await fetch("waiting.html").then(r => r.text());
    root.innerHTML = html;
    mount();
  }
}
