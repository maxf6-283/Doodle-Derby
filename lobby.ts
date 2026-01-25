import { insertCoin, onPlayerJoin, myPlayer, getRoomCode, getParticipants, isHost, PlayerState, getState, setState, onDisconnect, RPC } from "playroomkit";

try {
  await insertCoin({
    gameId: process.env.GAME_ID,
    skipLobby: true
  });
} catch {
  // we have been kicked
  alert("Permission denied - you have been kicked")
  window.location.href = "/"
}

const playerList = document.getElementById("playerList") as HTMLUListElement
const code_span = document.getElementById("code-span") as HTMLSpanElement
const name_update_button = document.getElementById("name-update-button") as HTMLButtonElement
const name_field = document.getElementById("name-field") as HTMLInputElement
const ready_button = document.getElementById("ready-button") as HTMLButtonElement
const settings_button = document.getElementById("settings-button") as HTMLButtonElement
const settings = document.getElementById("settings") as HTMLDivElement
const setting_of_some_kind = document.getElementById("setting-of-some-kind") as HTMLInputElement
const start_game = document.getElementById("start-game") as HTMLButtonElement
const lobby = document.getElementById("lobby") as HTMLDivElement
const game = document.getElementById("game") as HTMLDivElement

settings_button.addEventListener("click", () => {
  settings.hidden = !settings.hidden
})

myPlayer().setState("name", "unnamed player", true);
myPlayer().setState("ready", false, true);
const my_id = myPlayer().id

let player_nodes: { [p: string]: HTMLLIElement } = {}
let players_ready: { [p: string]: boolean } = {}

onPlayerJoin(player => {
  let name = player.getState("name");
  let playerNode = document.createElement("li");
  playerNode.textContent = name;
  playerList.appendChild(playerNode);
  player_nodes[player.id] = playerNode;
  player.onQuit(player => {
    player_nodes[player.id].remove();
    delete player_nodes[player.id]
  })
  updatePlayerName(player)
})

function updatePlayerName(player: PlayerState) {
  player_nodes[player.id].textContent = player.getState("name")

  if (player.getState("ready")) {
    player_nodes[player.id].textContent += " (ready)"
    players_ready[player.id] = true
  } else {
    players_ready[player.id] = false
  }
  if (player.id == my_id) {
    const bold = document.createElement("strong")
    bold.textContent = "You: "
    player_nodes[player.id].prepend(bold)
  } else if (isHost()) {
    const kick = document.createElement("button")
    kick.textContent = "Kick"
    kick.addEventListener("click", () => {
      player.kick()
    })
    player_nodes[player.id].append(kick)
  }
}

function allReady(): boolean {
  let all_ready = true;
  for (const [_, ready] of Object.entries(players_ready)) {
    if (!ready) {
      all_ready = false
      break
    }
  }
  return all_ready
}

// check for changes
setInterval(() => {
  let players = getParticipants()
  for (const [_, player] of Object.entries(players)) {
    updatePlayerName(player)
  }
  updateSettings()

  if (isHost()) {
    start_game.disabled = !allReady()
  }

  code_span.innerText = getRoomCode() ?? "Error";
}, 250)

onDisconnect((ev) => {
  alert(`Kicked from room: ${ev.reason}`)
  window.location.href = "/"
})


name_update_button.addEventListener("click", () => {
  myPlayer().setState("name", name_field.value)
})

name_field.addEventListener("keypress", (ev) => {
  if (ev.key == "Enter") {
    myPlayer().setState("name", name_field.value)
  }
})

ready_button.addEventListener("click", () => {
  if (myPlayer().getState("ready")) {
    myPlayer().setState("ready", false, true)
    ready_button.textContent = "Ready"
  } else {
    myPlayer().setState("ready", true, true)
    ready_button.textContent = "Unready"
  }
})

function updateSettings() {
  let settings = getState("settings")
  if (!settings) {
    settings = {
      setting_of_some_kind: 120
    }
  }
  if (!isHost()) {
    setting_of_some_kind.valueAsNumber = settings.setting_of_some_kind
    setting_of_some_kind.disabled = true;
  } else {
    setting_of_some_kind.disabled = false;
    settings.setting_of_some_kind = setting_of_some_kind.valueAsNumber
    setState("settings", settings, true)
  }
}

setting_of_some_kind.addEventListener("keydown", (ev) => {
  if (ev.key != "Enter") return
  updateSettings()
})

RPC.register("begin_game", async () => {
  lobby.hidden = true
  game.hidden = false
})

start_game.addEventListener("click", () => {
  if (isHost() && allReady()) {
    RPC.call("begin_game", {})
  }
})