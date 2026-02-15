import {
  getParticipants,
  getRoomCode,
  isHost,
  myPlayer,
  setState,
  getState,
  RPC,
  PlayerState,
  onPlayerJoin,
  onDisconnect,
} from "playroomkit";
import Konva from "konva";
import { Page } from "./page";
import { routerNavigate } from "./tiny_router";

const CHARACTER_PATHS = [
  "/characters/bear_icon.png",
  "/characters/bunny_icon.png",
  "/characters/chameleon_icon.png",
  "/characters/dog_icon.png",
  "/characters/fish_icon.png",
  "/characters/puppy_icon.png",
  "/characters/sheep_icon.png",
  "/characters/timmy_icon.png",
];

const ASSORTMENTS = [
  [
    "/accessories/top_hat.PNG",
    "/accessories/chef.PNG",
    "/accessories/clown.PNG",
    "/accessories/red_access.PNG",
  ],
  [
    "/accessories/shades.PNG",
    "/accessories/moustache.PNG",
    "/accessories/glasses.PNG",
    "/accessories/bow_tie.PNG",
    "/accessories/red_access.PNG",
  ],
  [
    "/accessories/boba.PNG",
    "/accessories/fishBowl.PNG",
    "/accessories/red_access.PNG",
  ],
];

let updateId: any;

function mount() {
  // --- DOM Element Selection ---
  const playerPopup = document.getElementById("player-popup") as HTMLDivElement;
  const playerGrid = document.getElementById("player-grid") as HTMLDivElement;
  const code_span = document.getElementById("code-span") as HTMLSpanElement;
  const startBtn = document.getElementById("start-btn") as HTMLButtonElement;
  const readyCount = document.getElementById("ready-count") as HTMLDivElement;
  const readyBtn = document.getElementById("ready-btn") as HTMLButtonElement;
  const settingsBtn = document.getElementById(
    "settings-btn",
  ) as HTMLButtonElement;
  const timerDuration = document.getElementById(
    "timerDuration",
  ) as HTMLSpanElement;
  const lessTimeBtn = document.getElementById("lessTime") as HTMLButtonElement;
  const moreTimeBtn = document.getElementById("moreTime") as HTMLButtonElement;
  const volumeSlider = document.getElementById(
    "volumeSlider",
  ) as HTMLInputElement;
  const volumeLevel = document.querySelector(
    'label[for="volume"]',
  ) as HTMLLabelElement;
  const customizeModal = document.getElementById(
    "customizePlayerModal",
  ) as HTMLDivElement;
  const settingsMenu = document.getElementById(
    "settingsMenu",
  ) as HTMLDivElement;
  const accessoryPicker = document.getElementById(
    "accessory-picker",
  ) as HTMLDivElement;
  const pickerGrid = document.getElementById("picker-grid") as HTMLDivElement;
  const closePickerBtn = document.getElementById(
    "close-picker",
  ) as HTMLButtonElement;
  const nameInput = document.getElementById("name-input") as HTMLInputElement;
  const charPreviewBtn = document.getElementById(
    "character-preview-btn",
  ) as HTMLButtonElement;
  const mainLobby = document.getElementById(
    "mainLobby-container",
  ) as HTMLDivElement;
  const gameDiv = document.getElementById("game-wrapper") as HTMLDivElement;

  let activeSlotIndex: number | null = null;
  const DEFAULT_SECS = 30;
  const MIN_SECS = 15;
  const MAX_SECS = 180;

  const modalCloseBtns = document.querySelectorAll(
    ".modal .close",
  ) as NodeListOf<HTMLElement>;
  const modals = [customizeModal, settingsMenu];

  // --- Initial Setup ---
  code_span.innerText = getRoomCode() ?? "Error";
  assignRandomCharacterIfNone();

  // --- Navigation Helpers ---
  function showGame() {
    if (mainLobby) mainLobby.style.display = "none";
    if (gameDiv) gameDiv.style.display = "block";
  }

  // --- Settings & Timer Logic ---
  function updateTimerDisplay() {
    let timerSeconds = getState("timer-seconds") ?? DEFAULT_SECS;
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    timerDuration.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    if (isHost()) {
      lessTimeBtn.disabled = timerSeconds <= MIN_SECS;
      moreTimeBtn.disabled = timerSeconds >= MAX_SECS;
    }
  }

  function updateVolumeDisplay() {
    volumeLevel.textContent = `Volume: ${volumeSlider.value}%`;
  }

  // --- Event Listeners ---
  settingsBtn.onclick = () => {
    settingsMenu.style.display = "flex";
    updateVolumeDisplay();
  };

  modalCloseBtns.forEach((btn) => {
    btn.onclick = () => {
      const parentModal = btn.closest(".modal") as HTMLDivElement;
      if (parentModal) parentModal.style.display = "none";
    };
  });

  lessTimeBtn.onclick = () => {
    if (!isHost()) return;
    let t = getState("timer-seconds") ?? DEFAULT_SECS;
    setState("timer-seconds", Math.max(MIN_SECS, t - 15));
    RPC.call("refresh_lobby_ui", {}, RPC.Mode.ALL);
  };

  moreTimeBtn.onclick = () => {
    if (!isHost()) return;
    let t = getState("timer-seconds") ?? DEFAULT_SECS;
    setState("timer-seconds", Math.min(MAX_SECS, t + 15));
    RPC.call("refresh_lobby_ui", {}, RPC.Mode.ALL);
  };

  readyBtn.onclick = () => {
    const currentState = myPlayer().getState("isReady") || false;
    myPlayer().setState("isReady", !currentState);
    RPC.call("refresh_lobby_ui", {}, RPC.Mode.ALL);
  };

  nameInput.onchange = () => {
    if (nameInput.value) {
      myPlayer().setState("name", nameInput.value);
      RPC.call("refresh_lobby_ui", {}, RPC.Mode.ALL);
    }
  };

  // --- Character Customization ---
  function openPicker(index: number) {
    activeSlotIndex = index;
    pickerGrid.innerHTML = "";
    const paths = index === -1 ? CHARACTER_PATHS : ASSORTMENTS[index];

    paths.forEach((path) => {
      const item = document.createElement("div");
      item.className = "picker-item";
      item.innerHTML = `<img src="${path}" />`;
      item.onclick = () => {
        if (index === -1) selectCharacter(path);
        else selectAccessory(path);
      };
      pickerGrid.appendChild(item);
    });
    accessoryPicker.classList.remove("hidden");
  }

  function selectCharacter(path: string) {
    myPlayer().setState(`character`, path);
    const display = document.getElementById("character-display");
    if (display) {
      display.innerHTML = `<img src="${path}" style="width:100%; height:100%; object-fit:contain;"/>`;
    }
    accessoryPicker.classList.add("hidden");
    RPC.call("refresh_lobby_ui", {}, RPC.Mode.ALL);
  }

  function selectAccessory(path: string) {
    if (activeSlotIndex === null) return;

    // 1. Update the small square slot icon in the modal
    const slotDisplay = document.getElementById(
      `slot-${activeSlotIndex}-display`,
    );
    if (slotDisplay) {
      slotDisplay.innerHTML = path.includes("red_access.PNG")
        ? ""
        : `<img src="${path}" style="max-width:65px; max-height:65px;">`;
    }

    // 2. Update the accessory on the large character preview
    const equipPath = path.replace("/accessories/", "/accessories-equip/");
    const previewLayer = document.getElementById(
      `preview-layer-${activeSlotIndex}`,
    );
    if (previewLayer) {
      if (path.includes("red_access.PNG")) {
        previewLayer.style.backgroundImage = "none";
      } else {
        previewLayer.style.backgroundImage = `url('${equipPath}')`;
        previewLayer.style.display = "block";
      }
    }

    // 3. Sync to Playroom
    myPlayer().setState(`acc_${activeSlotIndex}`, equipPath);
    accessoryPicker.classList.add("hidden");
    RPC.call("refresh_lobby_ui", {}, RPC.Mode.ALL);
  }

  charPreviewBtn.onclick = (e) => {
    accessoryPicker.style.top = `${e.clientY + window.scrollY}px`;
    accessoryPicker.style.left = `${e.clientX + window.scrollX}px`;
    openPicker(-1);
  };

  closePickerBtn.onclick = () => accessoryPicker.classList.add("hidden");

  // --- Core UI Loop ---
  function updateUI() {
    if (getState("game-started") || getState("gamePhase") === "writing") {
      clearInterval(updateId);
      routerNavigate("/pick-words");
      return;
    }

    const players = Object.values(getParticipants());
    const hostId = getState("hostId");
    let readyCountNum = 0;

    if (isHost()) {
      setState("hostId", myPlayer().id);
      startBtn.style.display = "block";
      startBtn.onclick = startGame;
    } else {
      startBtn.style.display = "none";
    }

    playerGrid.innerHTML = "";
    players.forEach((player) => {
      const isReady = player.getState("isReady") || false;
      if (isReady) readyCountNum++;

      const slot = document.createElement("div");
      slot.className = "player-slot active";
      slot.innerHTML = `
        ${player.id === hostId ? '<img src="/lobby/crown.png" class="crown-img">' : ""}
        <button class="player-button">
          <div class="stick-man">
            <img src="${player.getState("character") || CHARACTER_PATHS[0]}" style="width:100%; height:100%; object-fit:contain;" />
            <div class="acc-layer hat" style="background-image: url('${player.getState("acc_0") || ""}'); display: ${player.getState("acc_0") ? "block" : "none"}"></div>
            <div class="acc-layer face" style="background-image: url('${player.getState("acc_1") || ""}'); display: ${player.getState("acc_1") ? "block" : "none"}"></div>
            <div class="acc-layer item" style="background-image: url('${player.getState("acc_2") || ""}'); display: ${player.getState("acc_2") ? "block" : "none"}"></div>
          </div>
        </button>
        ${isReady ? '<div class="ready-tag">READY!</div>' : ""}
        <p>${player.getState("name") || "Player"} ${player.id === myPlayer().id ? "(You)" : ""}</p>
      `;

      const playerBtn = slot.querySelector(
        ".player-button",
      ) as HTMLButtonElement;
      playerBtn.addEventListener("click", (e) => {
        e.stopPropagation();

        // Position the popup next to the clicked button
        const rect = playerBtn.getBoundingClientRect();
        playerPopup.style.top = `${rect.top + window.scrollY}px`;
        playerPopup.style.left = `${rect.right + 10}px`;
        playerPopup.classList.remove("hidden");

        // Logic: Only show "Customize" if it's YOUR slot
        const customizeBtn = document.getElementById(
          "view-profile-btn",
        ) as HTMLButtonElement;
        if (player.id === myPlayer().id) {
          customizeBtn.style.display = "block";
          customizeBtn.onclick = () => {
            playerPopup.classList.add("hidden");
            customizeModal.style.display = "flex";
          };
        } else {
          customizeBtn.style.display = "none";
        }

        // Logic: Only show "Kick" if YOU are Host and it's NOT your slot
        const kickBtn = document.getElementById(
          "kick-btn",
        ) as HTMLButtonElement;
        const canKick = isHost() && player.id !== myPlayer().id;
        kickBtn.style.display = canKick ? "block" : "none";

        if (canKick) {
          kickBtn.onclick = () => {
            player.kick();
            playerPopup.classList.add("hidden");
          };
        }

        // Auto-hide if there are no available actions for this player
        if (!canKick && player.id !== myPlayer().id) {
          playerPopup.classList.add("hidden");
        }
      });

      playerGrid.appendChild(slot);
    });

    document.querySelectorAll(".accessory-slot").forEach((slot) => {
      slot.addEventListener("click", (e) => {
        const mouseEvent = e as MouseEvent;
        // Get the slot index from the data attribute (0, 1, or 2)
        const slotIndex = parseInt(slot.getAttribute("data-slot") || "0");
        activeSlotIndex = slotIndex;

        // Position the picker popup near the mouse click
        accessoryPicker.style.top = `${mouseEvent.clientY + window.scrollY}px`;
        accessoryPicker.style.left = `${mouseEvent.clientX + window.scrollX}px`;

        // Apply the slight tilt style from your CSS
        accessoryPicker.style.transform = "translateY(-100%) rotate(-1deg)";

        openPicker(slotIndex); //
      });
    });

    readyCount.innerText = `${readyCountNum}/${players.length} READY`;
    updateTimerDisplay();
  }

  function startGame() {
    const players = Object.values(getParticipants());
    if (players.every((p) => p.getState("isReady")) && players.length >= 3) {
      setState("game-started", true, true);
      RPC.call("pick-words", {}, RPC.Mode.ALL);
    } else {
      alert("Need 3+ players and everyone must be ready!");
    }
  }

  window.addEventListener("click", (e) => {
    modals.forEach((modal) => {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    });
    if (!playerPopup.contains(e.target as Node)) {
      playerPopup.classList.add("hidden");
    }
  });

  // --- RPC & Listeners ---
  RPC.register("refresh_lobby_ui", async () => updateUI());

  updateId = setInterval(updateUI, 500);
}

function assignRandomCharacterIfNone() {
  let character = myPlayer().getState("character");
  
  if (!character) {
    character = CHARACTER_PATHS[Math.floor(Math.random() * CHARACTER_PATHS.length)];
    myPlayer().setState("character", character); //
  }

  // Update the Preview DOM inside the customization modal
  const display = document.getElementById("character-display");
  if (display) {
    display.innerHTML = `<img src="${character}" style="width:100%; height:100%; object-fit:contain;" />`;
  }
}

export const LobbyPage: Page = {
  async render(root: HTMLElement) {
    const html = await fetch("lobby.html").then((r) => r.text());
    root.innerHTML = html;
    mount();
  },
};
