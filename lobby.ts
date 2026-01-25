import { insertCoin, onPlayerJoin, getParticipants, getRoomCode } from "playroomkit";

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

const playerList = document.getElementById("playerList") as HTMLUListElement;
const code_span = document.getElementById("code-span") as HTMLSpanElement;
const start_button = document.getElementById("start") as HTMLInputElement;

code_span.innerText = getRoomCode() ?? "Error";

export function enterRoom() {
    window.location.href = window.location.href.split("/")[0] + "/canvas.html#r=R" + getRoomCode();
}

start_button.addEventListener("click", enterRoom);

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
