const code_textbox = document.getElementById("join-code") as HTMLInputElement
const join_button = document.getElementById("join-button") as HTMLButtonElement

export function joinLobby() {
  const code = code_textbox.value

  if (code.length == 4) {
    window.location.href = window.location.href.split("/")[0] + "/lobby.html#r=R" + code
  } else {
    alert("Invalid code");
  }
}

join_button.addEventListener("click", joinLobby)