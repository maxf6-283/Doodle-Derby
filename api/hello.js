import { insertCoin, onPlayerJoin, getParticipants } from "playroomkit";

await insertCoin({});

let playerList = document.getElementById("playerList");

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
