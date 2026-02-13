import { getState, insertCoin, onDisconnect, switchRole } from "playroomkit";
import mountLobby from "./lobby"
import mountPickWords from "./pick-words"

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

const app = document.getElementById("app") as HTMLDivElement;

onDisconnect((ev) => {
  alert(`Kicked from room: ${ev.reason}`);
  window.location.href = "/";
});

async function switchScreen(screen: string) {
  switch (screen) {
    case "lobby": {
      const html = await fetch("lobby.html").then(r => r.text());
      app.innerHTML = html;
      mountLobby(switchScreen);
      break;
    }
    case "pick-words": {
      const html = await fetch("pick-words.html").then(r => r.text());
      app.innerHTML = html;
      mountPickWords(switchScreen)
      break;
    }
  }
}

const gameStarted = getState("game-started");
if (gameStarted) {
  switchScreen("pick-words");
} else {
  switchScreen("lobby");
}