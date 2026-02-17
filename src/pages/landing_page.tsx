import { render } from "solid-js/web"
import { Page } from "../../api/page"
import { createSignal } from "solid-js";
import { routerNavigate } from "../../api/tiny_router";

function joinLobby(code: string) {
  if (code.length == 4) {
    routerNavigate("/lobby");
    window.location.href = "/#r=R" + code
  } else {
    alert("Invalid code");
  }
}

function LandingMain() {
  const [lobbyCode, setLobbyCode] = createSignal("");

  return (
    <div>
      <h1>Doodle derby</h1>
      <button
        style="background-color: blue; color: white;"
        onClick={_ => routerNavigate("/lobby")}
      >
        CREATE NEW LOBBY
      </button>
      <br></br>
      <button
        style="background-color: blue; 
            color: white;"
        id="join-button"
        onClick={_ => joinLobby(lobbyCode())}
      >
        JOIN LOBBY
      </button>
      <input
        onKeyDown={
          ev => {
            if (ev.key === "Enter")
              joinLobby(lobbyCode())
          }
        }
        type="text"
        placeholder="CODE"
        id="join-code"
        onInput={(element) => setLobbyCode(element.currentTarget.value)}
      />
    </div>
  );
}

export const LandingPage: Page = {
  async render(root: HTMLElement) {
    this.onEnd = render(() => <LandingMain />, root);
  }
}
