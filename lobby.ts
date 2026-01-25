import { insertCoin, onPlayerJoin, myPlayer, getRoomCode, getParticipants, isHost, RPC, PlayerState } from "playroomkit";

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
const name_update_button = document.getElementById("name-update-button") as HTMLButtonElement;
const name_field = document.getElementById("name-field") as HTMLInputElement;

code_span.innerText = getRoomCode() ?? "Error";
myPlayer().setState("name", "unnamed player", true);
const my_id = myPlayer().id

let player_nodes: { [p: string]: HTMLLIElement } = {}

onPlayerJoin(player => {
  // This relies on the built in lobby
  // system. Will have to change how this 
  // works if/when we make our own custom
  // lobby.
  let name = player.getState("name");
  let playerNode = document.createElement("li");
  playerNode.textContent = name;
  playerList.appendChild(playerNode);
  player_nodes[player.id] = playerNode;
  player.onQuit(player => {
    player_nodes[player.id].remove();
    delete player_nodes[player.id]
  })
})

function updatePlayerName(player: PlayerState) {
  player_nodes[player.id].textContent = player.getState("name")
  if (player.id == my_id) {
    const bold = document.createElement("strong")
    bold.textContent = "You: "
    player_nodes[player.id].prepend(bold)
  }
}

// check for name changes every 1000 ms just in case
setInterval(() => {
  let players = getParticipants()
  for (const [_, player] of Object.entries(players)) {
    updatePlayerName(player)
  }
}, 1000)

RPC.register("update_name", async (_data, caller) => {
  updatePlayerName(caller)
})

name_update_button.addEventListener("click", () => {
  myPlayer().setState("name", name_field.value)
  RPC.call("update_name", {}, RPC.Mode.ALL)
})

RPC.call("update_name", {}, RPC.Mode.ALL)