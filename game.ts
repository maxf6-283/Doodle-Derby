import { insertCoin, onDisconnect, switchRole } from "playroomkit";
import mountLobby from "./lobby"

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
      alert("Your game is in another castle")
    }
  }
}

switchScreen("lobby")