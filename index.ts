console.log("index.ts loaded!");

const code_textbox = document.getElementById("join-code") as HTMLInputElement
const join_button = document.getElementById("join-button") as HTMLButtonElement

function joinLobby() {
  console.log("joinLobby called!");
  const code = code_textbox.value.trim()
  console.log("Code entered:", code);

  // Check if code is empty
  if (!code) {
    alert("Please enter a room code!");
    return;
  }

  window.location.href = "/lobby.html#r=R" + code
}

join_button.addEventListener("click", joinLobby)
console.log("Event listener attached!");