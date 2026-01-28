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
} from "playroomkit";

await insertCoin({
  // Put in environment variable using vercel
  // Can remove for testing on localhost
  //
  // To generate your own GAME_ID:
  // Go to https://joinplayroom.com/
  // Then go to Dev, log in, and create a new
  // project. From there you will get a unique
  // game ID to use
  gameId: process.env.GAME_ID,
  skipLobby: true,
});

const ASSORTMENTS = [
  [
    "/assets/accessories/top_hat.PNG",
    "/assets/accessories/chef.PNG",
    "/assets/accessories/clown.PNG",
    "none",
  ],
  [
    "/assets/accessories/shades.PNG",
    "/assets/accessories/disguiseMask.PNG",
    "/assets/accessories/stache.PNG",
    "/assets/accessories/bow_tie.PNG",
    "none",
  ],
  [
    "/assets/accessories/boba.PNG",
    "/assets/accessories/dona.PNG",
    "/assets/accessories/fishBowl.PNG",
    "none",
  ],
];

const MAX_PLAYERS = 8;

const playerPopup = document.getElementById("player-popup") as HTMLDivElement;
const playerGrid = document.getElementById("player-grid") as HTMLDivElement;
const code_span = document.getElementById("code-span") as HTMLSpanElement;
const startBtn = document.getElementById("start-btn") as HTMLButtonElement;
const readyCount = document.getElementById("ready-count") as HTMLDivElement;
const readyBtn = document.getElementById("ready-btn") as HTMLButtonElement;
const customizeModal = document.getElementById(
  "customizePlayerModal",
) as HTMLDivElement;
const modalCloseBtn = document.getElementsByClassName(
  "close",
)[0] as HTMLElement;

const accessoryPicker = document.getElementById(
  "accessory-picker",
) as HTMLDivElement;
const pickerGrid = document.getElementById("picker-grid") as HTMLDivElement;
const closePickerBtn = document.getElementById(
  "close-picker",
) as HTMLButtonElement;
let activeSlotIndex: number | null = null;

const closeModal = () => {
  customizeModal.style.display = "none";
};
modalCloseBtn.onclick = closeModal;

code_span.innerText = getRoomCode() ?? "Error";

readyBtn.addEventListener("click", () => {
  const currentState = myPlayer().getState("isReady") || false;
  myPlayer().setState("isReady", !currentState);
  updateUI();
});

if (isHost()) {
  startBtn.style.display = "block";
  startBtn.addEventListener("click", () => {
    // Logic to transition to the actual game
    console.log("Game Starting...");
  });
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
  pickerGrid.innerHTML = ""; // Clear existing items

  ASSORTMENTS[index].forEach((path) => {
    const item = document.createElement("div");
    item.className = "picker-item";

    // Handle "none" option
    if (path === "none") {
      item.innerText = "❌";
    } else {
      item.innerHTML = `<img src="${path}">`;
    }

    item.onclick = () => selectAccessory(path);
    pickerGrid.appendChild(item);
  });

  accessoryPicker.classList.remove("hidden");
}
function selectAccessory(path: string) {
  if (activeSlotIndex === null) return;

  // Sync choice to Playroom state
  myPlayer().setState(`acc_${activeSlotIndex}`, path);

  // Update the slot visual
  const display = document.getElementById(`slot-${activeSlotIndex}-display`);
  if (display) {
    display.innerHTML = path === "none" ? "" : `<img src="${path}">`;
  }

  accessoryPicker.classList.add("hidden");
}

function updateUI() {
  if (isHost()) {
    setState("hostId", myPlayer().id);
    startBtn.style.display = "block";
  } else {
    startBtn.style.display = "none";
  }

  const hostId = getState("hostId");

  const players = Object.values(getParticipants());
  let readyCountNum = 0;
  playerGrid.innerHTML = ""; // Clear current grid

  players.forEach((player) => {
    const profile = player.getProfile();
    const isReady = player.getState("isReady") || false;

    if (isReady) {
      readyCountNum++;
    }

    // Create the structure matching your lobby.css
    const slot = document.createElement("div");
    slot.className = "player-slot active";

    slot.innerHTML = `
      ${player.id === hostId ? '<img src="/assets/lobby/crown.png" class="crown-img" alt="Host">' : ""}
      <button class="player-button"><div class="stick-man" style="background-color: ${profile.color.hex}">ツ</div></button>
      ${isReady ? '<div class="ready-tag">READY!</div>' : ""}
      <p>${profile.name}</p>
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
          //player.kick(); KICK LOGIC HERE!
          playerPopup.classList.add("hidden");
        };
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
});

onPlayerJoin(() => updateUI());
onDisconnect(() => updateUI());
