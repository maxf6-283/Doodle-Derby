import { insertCoin, onPlayerJoin, myPlayer, getRoomCode, getParticipants, isHost, RPC, PlayerState, getState, setState } from "playroomkit";

await insertCoin({
  gameId: process.env.GAME_ID,
  skipLobby: true
});

const playerList = document.getElementById("playerList") as HTMLUListElement
const code_span = document.getElementById("code-span") as HTMLSpanElement
const name_update_button = document.getElementById("name-update-button") as HTMLButtonElement
const name_field = document.getElementById("name-field") as HTMLInputElement
const ready_button = document.getElementById("ready-button") as HTMLButtonElement
const settings_button = document.getElementById("settings-button") as HTMLButtonElement
const settings = document.getElementById("settings") as HTMLDivElement
const setting_of_some_kind = document.getElementById("setting-of-some-kind") as HTMLInputElement

settings_button.addEventListener("click", () => {
  settings.hidden = !settings.hidden
})

code_span.innerText = getRoomCode() ?? "Error";
myPlayer().setState("name", "unnamed player", true);
myPlayer().setState("ready", false, true);
const my_id = myPlayer().id

let player_nodes: { [p: string]: HTMLLIElement } = {}

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
  }
  if (player.id == my_id) {
    const bold = document.createElement("strong")
    bold.textContent = "You: "
    player_nodes[player.id].prepend(bold)
  }
}

// check for changes every 1000 ms just in case
setInterval(() => {
  let players = getParticipants()
  for (const [_, player] of Object.entries(players)) {
    updatePlayerName(player)
  }
  updateSettings()
}, 250)


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