import { insertCoin, onPlayerJoin, getParticipants } from "playroomkit";

await insertCoin({
  // Put in environment variable using vercel
  // Can remove for testing on localhost
  //
  // To generate your own GAME_ID:
  // Go to https://joinplayroom.com/
  // Then go to Dev, log in, and create a new
  // project. From there you will get a unique
  // game ID to use
  gameId: process.env.GAME_ID
});

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

