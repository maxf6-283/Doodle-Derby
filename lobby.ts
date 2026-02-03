import {
  insertCoin,
  onPlayerJoin,
  onDisconnect,
  getParticipants,
  getRoomCode,
  isHost,
  myPlayer,
  setState,
  getState
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
  "/assets/characters/bear_icon.png",
  "/assets/characters/bunny_icon.png",
  "/assets/characters/chameleon_icon.png",
  "/assets/characters/dog_icon.png",
  "/assets/characters/fish_icon.png",
  "/assets/characters/puppy_icon.png",
  "/assets/characters/sheep_icon.png",
  "/assets/characters/timmy_icon.png",
];

const ASSORTMENTS = [
  [
    "/assets/accessories/top_hat.PNG",
    "/assets/accessories/chef.PNG",
    "/assets/accessories/clown.PNG",
    "/assets/accessories/red_access.PNG",
  ],
  [
    "/assets/accessories/shades.PNG",
    "/assets/accessories/moustache.PNG",
    "/assets/accessories/glasses.PNG",
    "/assets/accessories/bow_tie.PNG",
    "/assets/accessories/red_access.PNG",
  ],
  [
    "/assets/accessories/boba.PNG",
    "/assets/accessories/dona.PNG",
    "/assets/accessories/fishBowl.PNG",
    "/assets/accessories/red_access.PNG",
  ],
];

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

let timerSeconds = 30; // default 30 seconds
const MIN_SECS = 15;
const MAX_SECS = 180;

function updateTimerDisplay() {
  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  timerDuration.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`; // ex: 01:00

  lessTimeBtn.disabled = timerSeconds <= MIN_SECS;
  moreTimeBtn.disabled = timerSeconds >= MAX_SECS;
}

lessTimeBtn.addEventListener("click", () => {
  timerSeconds = Math.max(MIN_SECS, timerSeconds - 15);
  updateTimerDisplay();
});

moreTimeBtn.addEventListener("click", () => {
  timerSeconds = Math.min(MAX_SECS, timerSeconds + 15);
  updateTimerDisplay();
});
updateTimerDisplay();

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
  updateUI();
});

let hostFeatureAdded = false;

nameInput.addEventListener("change", () => {
  if (nameInput.value) myPlayer().setState("name", nameInput.value);
  else nameInput.value = myPlayer().getState("name");
});

function startGame(readyCountNum: number) {
    // Logic to transition to the actual game
    if (readyCountNum != players.length) {
        alert("Someone is not ready!");
    }
    else {
        console.log("Game Starting...");
        //alert("pretend the game is starting here");
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
}
function selectAccessory(path: string) {
  if (activeSlotIndex === null) return;

  // Sync choice to Playroom state
  myPlayer().setState(`acc_${activeSlotIndex}`, path);

  // Update the slot visual
  const display = document.getElementById(`slot-${activeSlotIndex}-display`);
  if (display) {
    display.innerHTML =
      path === "/assets/accessories/red_access.PNG"
        ? ""
        : `<img src="${path}">`;
  }

  accessoryPicker.classList.add("hidden");
  //assuming path var started with /assets/accessories/soomething.PNG
  const previewPath = path.replace(
    "/assets/accessories/",
    "/assets/accessories-equip/",
  );
  setPreviewAccessory(activeSlotIndex, previewPath);
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

/**
 * Updates the visual preview of the character
 * @param slotId 0 for Hat, 1 for Face, 2 for Item
 * @param imagePath The URL to the accessory image (e.g., '/assets/hats/top-hat.png')
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

const players = Object.values(getParticipants());
function updateUI() {
  
  if (!hostFeatureAdded && isHost()) {
    setState("hostId", myPlayer().id);
    startBtn.style.display = "block";
    startBtn.addEventListener("click",()=>startGame(readyCountNum));
    hostFeatureAdded = true;
  } else if (hostFeatureAdded && !isHost()) {
    startBtn.style.display = "none";
    startBtn.removeEventListener("click", () => startGame(readyCountNum));
    hostFeatureAdded = false;
  }

  if (myPlayer().getState("name") == undefined) {
    myPlayer().setState("name", myPlayer().getProfile().name);
  }

  const hostId = getState("hostId");

  
  
  playerGrid.innerHTML = ""; // Clear current grid
    readyCountNum = 0;
    players.forEach((player) => {

    const name = player.getState("name");
    const characterImg = player.getState("character");

    const isReady = player.getState("isReady") || false;

    const characterDisplay = characterImg
      ? `<img src="${characterImg}" style="width:100%; height:100%; object-fit:contain;" />`
      : `ツ`;

    if (isReady) {
        readyCountNum++;
    }



    // Create the structure matching your lobby.css
    const slot = document.createElement("div");
    slot.className = "player-slot active";

    slot.innerHTML = `
  ${player.id === hostId ? '<img src="/assets/lobby/crown.png" class="crown-img" alt="Host">' : ""}
  <button class="player-button">
    <div class="stick-man">
      ${characterDisplay}
    </div>
  </button>
  ${isReady ? '<div class="ready-tag">READY!</div>' : ""}
  <p>${name} ${player.id === myPlayer().id ? "(You)" : ""}</p>
`;

    const playerBtn = slot.querySelector(".player-button") as HTMLButtonElement;
    playerBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent immediate closing from global listener

      // Position the popup near the clicked button
      const rect = playerBtn.getBoundingClientRect();
      playerPopup.style.top = `${rect.top + window.scrollY}px`;
      playerPopup.style.left = `${rect.right + 10}px`;

      playerPopup.classList.remove("hidden");

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
      const kickBtn = document.getElementById("kick-btn") as HTMLButtonElement;
      const canKick = isHost() && player.id !== myPlayer().id;
      kickBtn.style.display = canKick ? "block" : "none";

      if (canKick) {
        kickBtn.onclick = () => {
          player.kick();
          playerPopup.classList.add("hidden");
        };
      }

      //if no popups can be displayed, there is no point to popup the menu.
      if (!canKick && player.id != myPlayer().id) {
        playerPopup.classList.add("hidden");
      }
    });

    playerGrid.appendChild(slot);
  });

    readyCount.innerText = `${readyCountNum}/${players.length} READY`;
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
    updateUI();
  player.onQuit(() => updateUI());
});

onDisconnect((ev) => {
  alert(`Kicked from room: ${ev.reason}`);
  window.location.href = "/";
});

setInterval(updateUI, 250);
