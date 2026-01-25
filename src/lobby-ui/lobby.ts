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

const MAX_PLAYERS = 8;

const playerPopup = document.getElementById("player-popup") as HTMLDivElement;
const playerGrid = document.getElementById("player-grid") as HTMLDivElement;
const code_span = document.getElementById("code-span") as HTMLSpanElement;
const startBtn = document.getElementById("start-btn") as HTMLButtonElement;
const readyCount = document.getElementById("ready-count") as HTMLDivElement;
const readyBtn = document.getElementById("ready-btn") as HTMLButtonElement;

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

      
      const kickBtn = document.getElementById("kick-btn") as HTMLButtonElement;
      kickBtn.style.display = player.id === hostId ? "block" : "none";
    });

    playerGrid.appendChild(slot);
  });
  
  readyCount.innerText = `${readyCountNum}/${players.length} READY`;
}

window.addEventListener("click", (e) => {
  if (!playerPopup.contains(e.target as Node)) {
    playerPopup.classList.add("hidden");
  }
});

onPlayerJoin(() => updateUI());
onDisconnect(() => updateUI());
