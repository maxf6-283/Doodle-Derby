import { getParticipants, isHost, myPlayer, RPC } from "playroomkit";

import { Page } from "./page"
import { routerNavigate } from "./tiny_router";

const MAX_WORDS = 10;

const PICK_TIME = 30;

export default function mount() {
  const word_input = document.getElementById("word-input") as HTMLInputElement;
  const word_list = document.getElementById("word-list") as HTMLDivElement;
  const confirm_word_btn = document.getElementById("add-word-btn") as HTMLButtonElement;
  const continue_btn = document.getElementById("continue-btn") as HTMLButtonElement;
  const waiting_screen = document.getElementById("waiting-screen") as HTMLDivElement;
  const pick_words_container = document.querySelector(".pick-words-container") as HTMLDivElement;
  const players_progress_list = document.getElementById("players-progress-list") as HTMLDivElement;
  const start_game_btn = document.getElementById("start-game-btn") as HTMLButtonElement;
  const waiting_status_text = document.getElementById("waiting-status-text") as HTMLHeadingElement;

  let my_words: string[] = [];
  let timerId: number | null = null

  function updateUI() {
    const players = Object.values(getParticipants());
    players_progress_list.innerHTML = "";

    players.forEach((player) => {
      const name = player.getState("name") || "Guest";
      const characterImg = player.getState("character");
      const accessories = [
        player.getState("acc_0"),
        player.getState("acc_1"),
        player.getState("acc_2")
      ];

      const words_complete = player.getState("words_complete") ?? 0;
      const progressPercent = (words_complete / MAX_WORDS) * 100;

      const card = document.createElement("div");
      card.className = "player-progress-card";

      // Cleaner template literal using the merged CSS class
      card.innerHTML = `
        <span class="player-name-label">${name} ${player.id === myPlayer().id ? "(You)" : ""}</span>
        <div class="player-icon-wrapper">
          <div class="mini-stick-man">
            ${characterImg ? `<img src="${characterImg}" class="base-char" />` : "ツ"}
            ${accessories.filter(a => a).map(acc =>
        `<img src="${acc.replace("/accessories/", "/accessories-equip/")}" class="acc-layer" />`
      ).join("")}
          </div>
        </div>
        <div class="progress-container-vertical">
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${progressPercent}%"></div>
          </div>
          <span class="progress-text">${words_complete}/${MAX_WORDS}</span>
        </div>
      `;
      players_progress_list.append(card);
    });
  }

  function renderWords() {
    word_list.innerHTML = "";
    my_words.forEach((word, index) => {
      const wordDiv = document.createElement("div");
      wordDiv.className = "word-item";
      wordDiv.innerHTML = `<span>${word}</span>`;

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.innerHTML = "&times;";
      deleteBtn.onclick = () => {
        my_words.splice(index, 1);
        syncState();
      };

      wordDiv.appendChild(deleteBtn);
      word_list.appendChild(wordDiv);
    });

    // Logical check moved OUTSIDE the loop
    continue_btn.style.display = my_words.length >= MAX_WORDS ? "block" : "none";
  }

  // Consolidated sync function to avoid repeated setState calls
  function syncState() {
    myPlayer().setState("words", my_words);
    myPlayer().setState("words_complete", my_words.length);
    renderWords();
  }

  function submitWord() {
    const new_word = word_input.value.trim();
    if (my_words.length < MAX_WORDS && new_word.length > 0) {
      my_words.push(new_word);
      word_input.value = "";
      syncState();
    } else {
      word_input.classList.add("error-shake");
      setTimeout(() => word_input.classList.remove("error-shake"), 300);
    }
  }

  word_input.addEventListener("keydown", (ev) => ev.key === "Enter" && submitWord());
  confirm_word_btn.addEventListener("click", submitWord);

  continue_btn.addEventListener("click", () => {
    pick_words_container.style.display = "none";
    waiting_screen.style.display = "flex";
    continue_btn.style.display = "none";
    myPlayer().setState("picked_words", true);
    RPC.call("player-picked-words", {}, RPC.Mode.HOST);
  });
  start_game_btn.addEventListener("click", () => {
    RPC.call("players-start-game", {}, RPC.Mode.ALL);
  });

  RPC.register("players-start-game", async () => {
    routerNavigate("/game");
  });

  RPC.register("all-players-ready", async (_payload, _player) => {
    waiting_status_text.innerText = "Waiting for the Host to start...";
  });

  RPC.register("player-picked-words", async (_payload, _player) => {
    const players = Object.values(getParticipants());
    const allFinished = players.every(p => p.getState("picked_words") === true);

    if (allFinished) {
      // Tell everyone (including the host themselves) that we are ready
      start_game_btn.style.display = "block";
      waiting_status_text.innerText = "Start Doodling!";
      RPC.call("all-players-ready", {}, RPC.Mode.OTHERS);
    }
  });

  setInterval(updateUI, 250)

  console.log("HELP", word_input)
}

export const PickWordsPage: Page = {
  async render(root: HTMLElement) {
    const html = await fetch("pick-words.html").then(r => r.text());
    root.innerHTML = html;
    mount();
  }
}
