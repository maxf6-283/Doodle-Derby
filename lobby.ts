import {
  insertCoin,
  onPlayerJoin,
  onDisconnect,
  getParticipants,
  getRoomCode,
  isHost,
  myPlayer,
  setState,
  getState,
  RPC,
  RPCCallback,
  RPCMode,
  PlayerState,
} from "playroomkit";

import Konva from "konva"

try {
  await insertCoin({
    gameId: process.env.GAME_ID,
      skipLobby: true,
      maxPlayersPerRoom: 8
  });
} catch {
  // we have been kicked
  alert("Permission denied - you have been kicked");
  window.location.href = "/";
}

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
    "/accessories/dona.PNG",
    "/accessories/fishBowl.PNG",
    "/accessories/red_access.PNG",
  ],
];

assignRandomCharacterIfNone();

const MAX_PLAYERS = 8;
let readyCountNum = 0;

const mainLobby = document.getElementById('mainLobby-container') as HTMLDivElement;
const gameDiv = document.getElementById('game-wrapper') as HTMLDivElement;
function showGame() { //A new Konva layer to transition to the page for inputting prompts
    if (mainLobby) mainLobby.style.display = 'none';
    if (gameDiv) gameDiv.style.display = 'block';
}

function showLobby() {
    if (gameDiv) gameDiv.style.display = 'none';
    if (mainLobby) mainLobby.style.display = 'block';
}
const stage = new Konva.Stage({
    container: 'game-container',
    width: window.innerWidth,
    height: window.innerHeight,
});
const promptPage = new Konva.Layer();
stage.add(promptPage);
showLobby();
//showGame(); 


const playerPopup = document.getElementById("player-popup") as HTMLDivElement;
const playerGrid = document.getElementById("player-grid") as HTMLDivElement;
const code_span = document.getElementById("code-span") as HTMLSpanElement;
const startBtn = document.getElementById("start-btn") as HTMLButtonElement;
const readyCount = document.getElementById("ready-count") as HTMLDivElement;
const readyBtn = document.getElementById("ready-btn") as HTMLButtonElement;
const back_btn = document.getElementById('back_btn') as HTMLDivElement;
const submitBtn = document.getElementById('submitBtn') as HTMLButtonElement;
const promptInput = document.getElementById('promptInput') as HTMLInputElement;
const uiLayer = document.getElementById('ui-layer') as HTMLDivElement;
const settingsBtn = document.getElementById(
  "settings-btn",
) as HTMLButtonElement;
const timerDuration = document.getElementById(
  "timerDuration",
) as HTMLSpanElement;
const lessTimeBtn = document.getElementById("lessTime") as HTMLButtonElement;
const moreTimeBtn = document.getElementById("moreTime") as HTMLButtonElement;
const lessPromptsBtn = document.getElementById('lessPrompt') as HTMLButtonElement;
const morePromptsBtn = document.getElementById('morePrompt') as HTMLButtonElement;
const num_prompts = document.getElementById('num_rounds') as HTMLSpanElement;
const volumeLevel = document.querySelector(
  'label[for="volume"]',
) as HTMLLabelElement;
const volumeSlider = document.getElementById(
  "volumeSlider",
) as HTMLInputElement;
const customizeModal = document.getElementById(
  "customizePlayerModal",
) as HTMLDivElement;
const modalCloseBtns = document.querySelectorAll(
  ".modal .close",
) as NodeListOf<HTMLElement>; //Finds all .close elements in class .modal --> Returns all nodes found
modalCloseBtns.forEach((btn) => {
  btn.onclick = () => {
    const parentModal = btn.closest(".modal") as HTMLDivElement;
    if (parentModal) {
      parentModal.style.display = "none";
    }
  };
});
const settingsMenu = document.getElementById("settingsMenu") as HTMLDivElement;
const accessoryPicker = document.getElementById(
  "accessory-picker",
) as HTMLDivElement;
const pickerGrid = document.getElementById("picker-grid") as HTMLDivElement;
const closePickerBtn = document.getElementById(
  "close-picker",
) as HTMLButtonElement;
const nameInput = document.getElementById("name-input") as HTMLInputElement;

let activeSlotIndex: number | null = null;
const charPreviewBtn = document.getElementById(
  "character-preview-btn",
) as HTMLButtonElement;

const closeModal = () => {
  customizeModal.style.display = "none";
  settingsMenu.style.display = "none";
};

code_span.innerText = getRoomCode() ?? "Error";

/////////////////////////// SETTINGS MENU ////////////////////////////////
settingsBtn.addEventListener("click", () => {
  settingsMenu.style.display = "flex";
});

let num_input = 0;
submitBtn.addEventListener('click', () => {
    num_input++;
    const prompts = myPlayer().getState('prompts') || [];
    prompts.push(promptInput.value);
    myPlayer().setState('prompts', prompts);
    promptInput.value = "";
    if (num_input >= numberOfPrompts) {
        uiLayer.style.display = 'none';
    }
});


back_btn.addEventListener('click', () => {
    document.location.href = "/index.html";
});

const DEFAULT_SECS = 30;
const MIN_SECS = 15;
const MAX_SECS = 180;

function updateTimerDisplay() {
  let timerSeconds = getState("timer-seconds");
  if (timerSeconds == undefined) {
    if (isHost()) {
      setState("timer-seconds", DEFAULT_SECS);
    }
    timerSeconds = DEFAULT_SECS;
  }

  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  timerDuration.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`; // ex: 01:00

  lessTimeBtn.disabled = timerSeconds <= MIN_SECS || !isHost();
  moreTimeBtn.disabled = timerSeconds >= MAX_SECS || !isHost();
}

lessTimeBtn.addEventListener("click", () => {
  if (isHost()) {
    let timerSeconds = getState("timer-seconds") ?? DEFAULT_SECS;
    timerSeconds = Math.max(MIN_SECS, timerSeconds - 15);
    setState("timer-seconds", timerSeconds);
  }
  updateTimerDisplay();
  RPC.call("refresh_lobby_ui", {}, RPC.Mode.ALL);
});

moreTimeBtn.addEventListener("click", () => {
  if (isHost()) {
    let timerSeconds = getState("timer-seconds") ?? DEFAULT_SECS;
    timerSeconds = Math.min(MAX_SECS, timerSeconds + 15);
    setState("timer-seconds", timerSeconds);
  }
  updateTimerDisplay();
  RPC.call("refresh_lobby_ui", {}, RPC.Mode.ALL);
});

let numberOfPrompts = 5;

lessPromptsBtn.addEventListener('click', () => {
    numberOfPrompts -= 1;
    num_prompts.innerText = String(numberOfPrompts);
    morePromptsBtn.disabled = numberOfPrompts >= 10;
    lessPromptsBtn.disabled = (numberOfPrompts <= 5);
});

morePromptsBtn.addEventListener('click', () => {
    numberOfPrompts += 1;
    num_prompts.innerText = String(numberOfPrompts);
    morePromptsBtn.disabled = numberOfPrompts >= 10;
    lessPromptsBtn.disabled = numberOfPrompts <= 5;
});
lessPromptsBtn.disabled = true;

function updateVolumeDisplay() {
  volumeLevel.textContent = `Volume: ${volumeSlider.value}%`;
}

volumeSlider.addEventListener("input", () => {
  updateVolumeDisplay();
});
updateVolumeDisplay();
/////////////////////////// LOBBY LOGIC ////////////////////////////////

readyBtn.addEventListener("click", () => {
  const currentState = myPlayer().getState("isReady") || false;
  myPlayer().setState("isReady", !currentState);
  RPC.call("refresh_lobby_ui", {}, RPC.Mode.ALL);
});

let hostFeatureAdded = false;

nameInput.addEventListener("change", () => {
  if (nameInput.value) {
    myPlayer().setState("name", nameInput.value);
    RPC.call("refresh_lobby_ui", {}, RPC.Mode.ALL);
  } else nameInput.value = myPlayer().getState("name");
});

function startGame() {
  const currentPlayers = Object.values(getParticipants());
  
  const currentReadyCount = currentPlayers.filter(p => p.getState("isReady")).length;

  
  if (currentReadyCount !== currentPlayers.length) {
      alert("Someone is not ready!");
      return;
  }
  if (currentPlayers.length < 3) {
    alert("Need at least 3 players to start!");
    return;
  }

  if (isHost()) {
      console.log("Starting Game...");
      setState("gamePhase", "writing");
  }
}



document.querySelectorAll(".accessory-slot").forEach((slot, index) => {
  slot.addEventListener("click", (e) => {
    const mouseEvent = e as MouseEvent;
    activeSlotIndex = index;
    const mouseX = mouseEvent.clientX;
    const mouseY = mouseEvent.clientY;
    accessoryPicker.style.top = `${mouseY + window.scrollY}px`;
    accessoryPicker.style.left = `${mouseX + window.scrollX}px`;
    //bottom left anchor
    accessoryPicker.style.transform = "translateY(-100%) rotate(-1deg)";
    openPicker(index);
  });
});
closePickerBtn.onclick = () => accessoryPicker.classList.add("hidden");

function openPicker(index: number) {
  // index = -1 : CHARACTER PICKER
  // index = 0 : HAT PICKER
  // index = 1 : FACE PICKER
  // index = 2 : ITEM PICKER
  pickerGrid.innerHTML = ""; // Clear existing items

  if (index == -1) {
    CHARACTER_PATHS.forEach((path) => {
      const item = document.createElement("div");
      item.className = "picker-item";

      // Handle "none" option

      item.innerHTML = `<img src="${path}" />`;

      item.onclick = () => selectCharacter(path);
      pickerGrid.appendChild(item);
    });
  } else {
    ASSORTMENTS[index].forEach((path) => {
      const item = document.createElement("div");
      item.className = "picker-item";

      // Handle "none" option

      item.innerHTML = `<img src="${path}">`;

      item.onclick = () => selectAccessory(path);
      pickerGrid.appendChild(item);
    });
  }

  accessoryPicker.classList.remove("hidden");
}
function selectCharacter(path: string) {
  myPlayer().setState(`character`, path);
  const display = document.getElementById("character-display");
  if (display) {
    display.innerHTML = `<img src="${path}"/>`;
  }
  accessoryPicker.classList.add("hidden");
  RPC.call("refresh_lobby_ui", {}, RPC.Mode.ALL);
}
function selectAccessory(path: string) {
  if (activeSlotIndex === null) return;

  // Update the slot visual
  const display = document.getElementById(`slot-${activeSlotIndex}-display`);
  if (display) {
    display.innerHTML =
      path === "/accessories/red_access.PNG" ? "" : `<img src="${path}">`;
  }

  accessoryPicker.classList.add("hidden");
  //assuming path var started with /accessories/soomething.PNG
  const previewPath = path.replace("/accessories/", "/accessories-equip/");
  setPreviewAccessory(activeSlotIndex, previewPath);
  myPlayer().setState(`acc_${activeSlotIndex}`, previewPath);
  RPC.call("refresh_lobby_ui", {}, RPC.Mode.ALL);
}

charPreviewBtn.addEventListener("click", (e) => {
  // Option A: Open the first picker slot (Hats) automatically
  const mouseEvent = e as MouseEvent;

  const mouseX = mouseEvent.clientX;
  const mouseY = mouseEvent.clientY;

  accessoryPicker.style.top = `${mouseY + window.scrollY}px`;
  accessoryPicker.style.left = `${mouseX + window.scrollX}px`;
  accessoryPicker.style.transform = "translateY(-100%) rotate(-1deg)";

  openPicker(-1); // Call the existing openPicker function
});

RPC.register("refresh_lobby_ui", refreshLobbyUIRPC);
async function refreshLobbyUIRPC(
  payload: any,
  senderPlayer: PlayerState,
  mode: RPCMode,
) {
  updateUI();
}

/**
 * Updates the visual preview of the character
 * @param slotId 0 for Hat, 1 for Face, 2 for Item
 * @param imagePath The URL to the accessory image (e.g., '/hats/top-hat.png')
 */
function setPreviewAccessory(slotId: number, imagePath: string | null): void {
  const layer = document.getElementById(`preview-layer-${slotId}`);

  if (layer) {
    if (imagePath) {
      layer.style.backgroundImage = `url('${imagePath}')`;
      layer.style.display = "block";
    } else {
      // Handle "None" or clearing the slot
      layer.style.backgroundImage = "none";
    }
  }
}

function updateUI() {
  if (getState("gamePhase") === "writing") {
    showGame();
    return;
}
  const players = Object.values(getParticipants());

  if (isHost()) {
    setState("hostId", myPlayer().id);
    startBtn.style.display = "block";
    startBtn.onclick = startGame; 
  } else {
    startBtn.style.display = "none";
    startBtn.onclick = null;
  }

  if (myPlayer().getState("name") == undefined) {
    myPlayer().setState("name", myPlayer().getProfile().name);
    RPC.call("refresh_lobby_ui", {}, RPC.Mode.ALL);
  }

  updateTimerDisplay();

  const hostId = getState("hostId");

  playerGrid.innerHTML = ""; 
  let readyCountNum = 0; 

  players.forEach((player) => {
    const name = player.getState("name");
    const characterImg = player.getState("character");
    const hatImg = player.getState("acc_0");
    const faceImg = player.getState("acc_1");
    const itemImg = player.getState("acc_2");
    const isReady = player.getState("isReady") || false;

    if (isReady) {
        readyCountNum++;
    }

    const characterDisplay = `<img src="${characterImg}" style="width:100%; height:100%; object-fit:contain;" />`;
    
    const getLayerStyle = (img: string | undefined) => {
      if (!img || img === "/accessories/red_access.PNG") return "display: none;";
      const equipPath = img.replace("/accessories/", "/accessories-equip/");
      return `background-image: url('${equipPath}'); display: block;`;
    };

    const slot = document.createElement("div");
    slot.className = "player-slot active";

    slot.innerHTML = `
      ${player.id === hostId ? '<img src="/lobby/crown.png" class="crown-img" alt="Host">' : ""}
      <button class="player-button">
        <div class="stick-man">
          ${characterDisplay}
          <div class="acc-layer hat" style="${getLayerStyle(hatImg)}"></div>
          <div class="acc-layer face" style="${getLayerStyle(faceImg)}"></div>
          <div class="acc-layer item" style="${getLayerStyle(itemImg)}"></div>
        </div>
      </button>
      ${isReady ? '<div class="ready-tag">READY!</div>' : ""}
      <p>${name} ${player.id === myPlayer().id ? "(You)" : ""}</p>
    `;

    const playerBtn = slot.querySelector(".player-button") as HTMLButtonElement;
    playerBtn.addEventListener("click", (e) => {
      e.stopPropagation(); 

      const rect = playerBtn.getBoundingClientRect();
      playerPopup.style.top = `${rect.top + window.scrollY}px`;
      playerPopup.style.left = `${rect.right + 10}px`;
      playerPopup.classList.remove("hidden");

      const customizeBtn = document.getElementById("view-profile-btn") as HTMLButtonElement;
      if (player.id === myPlayer().id) {
        customizeBtn.style.display = "block";
        customizeBtn.onclick = () => {
          playerPopup.classList.add("hidden");
          customizeModal.style.display = "flex";
        };
      } else {
        customizeBtn.style.display = "none";
      }

      const kickBtn = document.getElementById("kick-btn") as HTMLButtonElement;
      const canKick = isHost() && player.id !== myPlayer().id;
      kickBtn.style.display = canKick ? "block" : "none";

      if (canKick) {
        kickBtn.onclick = () => {
          player.kick();
          playerPopup.classList.add("hidden");
        };
      }

      if (!canKick && player.id != myPlayer().id) {
        playerPopup.classList.add("hidden");
      }
    });

    playerGrid.appendChild(slot);
  });

  readyCount.innerText = `${readyCountNum}/${players.length} READY`;
}

function assignRandomCharacterIfNone() {
  if (!myPlayer().getState("character")) {
    const randomIndex = Math.floor(Math.random() * CHARACTER_PATHS.length);
    const randomCharacter = CHARACTER_PATHS[randomIndex];
    myPlayer().setState("character", randomCharacter);
  }
}

window.addEventListener("click", (e) => {
  if (!playerPopup.contains(e.target as Node)) {
    playerPopup.classList.add("hidden");
  }
  if (e.target === customizeModal) {
    closeModal();
  }
  if (e.target === settingsMenu) {
    closeModal();
  }
});

onPlayerJoin((player) => {
  if (!player.getState("name")) {
    player.setState("name", player.getProfile().name, true);
  }
  if (player.getState("character") === undefined) {
    player.setState("character", CHARACTER_PATHS[0], true); // Set to bear_icon.png
  }
  const charDisplay = document.getElementById("character-display");
  if (charDisplay) {
    charDisplay.innerHTML = `<img src="${player.getState("character")}" alt="Default Bear" />`;
  }
  updateUI();
  player.onQuit(() => updateUI());
});

onDisconnect((ev) => {
  alert(`Kicked from room: ${ev.reason}`);
  window.location.href = "/";
});

setInterval(updateUI, 250);