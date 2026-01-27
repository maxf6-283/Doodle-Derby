import { insertCoin, onPlayerJoin, getParticipants, getRoomCode, isHost} from "playroomkit";

const urlHash = window.location.hash;
const isJoining = urlHash && urlHash.includes("#r=R");

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
  skipLobby: true
});

if (isHost() && isJoining) {
  alert("Could not find that room. The code may be invalid or the room may have closed. Creating a new room instead.");
}

const playerList = document.getElementById("playerList") as HTMLUListElement;
const code_span = document.getElementById("code-span") as HTMLSpanElement;
const startGameButton = document.getElementById("start-game") as HTMLButtonElement;

code_span.innerText = getRoomCode() ?? "Error";

if(isHost()) {
  startGameButton.style.display = "block";
}



onPlayerJoin(player => {
  // This relies on the built in lobby
  // system. Will have to change how this 
  // works if/when we make our own custom
  // lobby.
  let name = player.getProfile().name;
  let playerNode = document.createElement("li");
  playerNode.textContent = name;
  playerList.appendChild(playerNode);
})

function startGame() {
  // TODO: Navigate to writing page when it exists
  alert("Game starting! (Writing page not created yet)");
  // window.location.href = "/writing.html";
}

startGameButton.addEventListener("click", startGame);