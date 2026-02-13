import { insertCoin, onDisconnect, switchRole } from "playroomkit";
import { LobbyPage } from "./lobby"
import { PickWordsPage } from "./pick-words"
import { WaitingPage } from "./waiting"

import { routerNavigate, addPage, getPage } from "./tiny_router";

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
addPage("/waiting", WaitingPage);

routerNavigate("/lobby");

// browser back/forward
// We will think about back/forward history later
// window.onpopstate = () => {
//   const page = getPage(location.pathname);
//   if (page) {
//     routerNavigate(location.pathname);
//   }
// }
