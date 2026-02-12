import { setInterval } from "node:timers/promises";
import { getParticipants, myPlayer, getRoomCode } from "playroomkit";

const MAX_WORDS = 10

export default function mount(switchScreen: (name: string) => void) {
  const code_span = document.getElementById("code-span") as HTMLSpanElement;
  const settingsBtn = document.getElementById(
    "settings-btn",
  );
  const players_list = document.getElementById("player-list") as HTMLDivElement

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
  }

  window.setInterval(updateUI, 250)
}