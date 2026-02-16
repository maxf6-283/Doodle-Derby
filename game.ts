import { insertCoin, onDisconnect, getState } from "playroomkit";
import { LobbyPage } from "./lobby"
import { PickWordsPage } from "./pick-words"
import { GameplayPage } from "./gameplay_page";

import { routerNavigate, addPage } from "./tiny_router";

try {
  await insertCoin({
    gameId: process.env.GAME_ID,
    skipLobby: true,
  });
} catch {
  // we have been kicked
  alert("Permission denied - you have been kicked");
  window.location.href = "/";
}

onDisconnect((ev) => {
  alert(`Kicked from room: ${ev.reason}`);
  window.location.href = "/";
});

addPage("/lobby", LobbyPage);
addPage("/pick-words", PickWordsPage);
addPage("/game", GameplayPage);

const gameStarted = getState("game-started");
if (gameStarted) {
  routerNavigate("/pick-words");
} else {
  routerNavigate("/lobby");
}
