import { render } from "solid-js/web";
import { Page } from "../../api/page";
import { createSignal, Show } from "solid-js";
import { routerNavigate } from "../../api/tiny_router";
import "../../style/landing-page.css";
import { insertCoin, isHost, myPlayer } from "playroomkit";

async function joinLobby(code: string) {
  if (code.length == 4) {
    try {
      await insertCoin({
        gameId: process.env.GAME_ID,
        roomCode: code,
        skipLobby: true,
      });

      if (isHost()) {
        // Leave the accidental new room
        myPlayer().leaveRoom();
        alert("Lobby not found. Please check the code.");
        return;
      }

      routerNavigate("/lobby");
      window.location.href = "/#r=R" + code;
    } catch (error) {
      alert("Lobby not found. Please check the code.");
      return;
    }
  } else {
    alert("Invalid code");
  }
}

function LandingMain() {
  const [lobbyCode, setLobbyCode] = createSignal("");
  const [showJoinInput, setShowJoinInput] = createSignal(false);
  let logoClickCount = 0;
  const logoClickEvent = 20;
  const eventDuration = 10;

  const spawnSheep = () => {
    const doodle = document.createElement("img");
    doodle.src = "/landing-page/sheep_loading.png";
    doodle.classList.add("moving-sheep");

    const randomTop = Math.random() * 80;
    const randomDuration = 1 + Math.random() * 1.5;
    const randomSize = 30 + Math.random() * 100;

    Object.assign(doodle.style, {
      top: `${randomTop}%`,
      width: `${randomSize}px`,
      animation: `moveLeft ${randomDuration}s linear forwards`,
      zIndex: Math.floor(Math.random() * 5) - 2,
    });

    document.body.appendChild(doodle);
    setTimeout(() => doodle.remove(), randomDuration * 1000);
  };
  const handleLogoClick = () => {
    logoClickCount++;
    if (logoClickCount >= logoClickEvent) {
      const interval = setInterval(spawnSheep, 50);
      setTimeout(() => clearInterval(interval), eventDuration * 1000);
      logoClickCount = 0;
    }
  };
  const handleJoinClick = async () => {
    // If input is already shown and there is a code, join the lobby
    if (showJoinInput() && lobbyCode().length === 4) {
      await joinLobby(lobbyCode());
    } else {
      // Otherwise, just show the input field
      setShowJoinInput(true);
    }
  };
  return (
    <div class="landing-page-body">
      {/* Main Logo Section */}
      <div class="game-wrapper">
        <button class="logo-button" onClick={handleLogoClick}>
          <img
            src="/landing-page/logo.png"
            alt="Doodle Derby"
            class="logo-img"
          />
        </button>
      </div>

      {/* Reactions */}

    <div class="reac-container">
      <button class="reac-button"
        onClick={() => {
              const sound = new Audio("/audio/bark.mp3");
              sound.play();
            }}>
        <img src="/reactions/cool.png" class="reac-img" alt="Cool"/>
      </button>
      <button class="reac-button">
        <img src="/reactions/ellipsis.png" class="reac-img" alt="Ellipsis"/>
      </button>
      <button class="reac-button">
        <img src="/reactions/laugh.png" class="reac-img" alt="Laugh"/>
      </button>
      <button class="reac-button">
        <img src="/reactions/question.png" class="reac-img" alt="Question"/>
      </button>
      <button class="reac-button">
        <img src="/reactions/sad.png" class="reac-img" alt="Sad"/>
      </button>
      <button class="reac-button">
        <img src="/reactions/tomato.png" class="reac-img" alt="Tomato"/>
      </button>
    </div>


      {/* Center Actions */}
      <div class="button-container">
        <button
          class="image-button"
          onClick={async () => {
            await insertCoin({
              gameId: process.env.GAME_ID,
              skipLobby: true,
            });
            routerNavigate("/lobby");
          }}
        >
          <img src="/landing-page/create_button_flat.png" class="btn-idle" />
          <img src="/landing-page/create_button_hover.png" class="btn-hover" />
        </button>

        <div class="join-input-section">
          <button class="image-button" onClick={() => handleJoinClick()}>
            <img src="/landing-page/join_button_flat.png" class="btn-idle" />
            <img src="/landing-page/join_button_hover.png" class="btn-hover" />
          </button>
          <Show when={showJoinInput()}>
            <input
              type="text"
              class="join-code-input"
              placeholder="CODE"
              value={lobbyCode()}
              onInput={(e) => setLobbyCode(e.currentTarget.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && joinLobby(lobbyCode())}
              maxLength={4}
              autofocus
            />
          </Show>
        </div>
      </div>

      {/* Footer Navigation */}
      <div class="footer-nav">
        <div>
          <span class="version-text">Version 0.0.1</span>
          <span
            class="footer-link"
            onClick={() => alert("Credits coming soon!")}
          >
            credits
          </span>
          <span class="footer-link" onClick={() => alert("Draw fast!")}>
            how to play
          </span>
        </div>
      </div>
    </div>
  );
}

export const LandingPage: Page = {
  async render(root: HTMLElement) {
    this.onEnd = render(() => <LandingMain />, root);
  },
};
