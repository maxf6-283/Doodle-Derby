import { render } from "solid-js/web";
import { Page } from "../../api/page";
import { createSignal, onCleanup, onMount, Show } from "solid-js";
import { routerNavigate } from "../../api/tiny_router";
import "../../style/landing-page.css";
import { insertCoin, isHost, myPlayer } from "playroomkit";
import { AudioManager } from "../components/AudioManager";
import { MuteButton } from "../components/MuteButton";

import {
  PromptModal,
  AlertModal,
  AlertModalProps,
  PromptModalState,
} from "../../api/modals/ModalComponents";

function LandingMain() {
  let logoClickCount = 0;
  const logoClickEvent = 20;
  const eventDuration = 10;
  const [alertModal, setAlertModal] = createSignal<AlertModalProps | null>(
    null,
  );
  const [promptModal, setPromptModal] = createSignal<PromptModalState | null>(
    null,
  );

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
  const showAlert = (
    title: string | null,
    message: string,
    imgSrc?: string,
  ) => {
    setAlertModal({ title, message, imgSrc });
  };

  const showPrompt = (
    label: string,
    placeholder: string,
    onConfirm: (value: string | null) => void,
  ) => {
    setPromptModal({ label, placeholder, onConfirm });
  };

  const joinLobby = async (code: string) => {
    if (code.length === 4) {
      try {
        await insertCoin({
          gameId: process.env.GAME_ID,
          roomCode: code,
          skipLobby: true,
        });

        if (isHost()) {
          // Leave the accidental new room
          myPlayer().leaveRoom();
          showAlert(null, "Lobby not found. Please check the code.");
          return;
        }

        routerNavigate("/lobby");
        window.location.href = "/#r=R" + code;
      } catch (error) {
        showAlert(null, "Lobby not found. Please check the code.");
        return;
      }
    } else {
      showAlert(null, "Invalid code");
    }
  };

  const handleJoinClick = async () => {
    showPrompt("Enter Game Code:", "e.g. ABC123", async (code) => {
      if (!code) return;
      await joinLobby(code);
    });
  };

  onMount(() => {
    AudioManager.playLoop("/audio/DDsong.mp3");
  });

  const handleCredits = () => {
    showAlert(
      "Credits!!",
      "Artists: Allie, Jay, Marissa, Bella\n" +
        "Programmers: Neel, Seven, Zidane, Isha, Jack, Adrian\n" +
        "Audio: Jay\n" +
        "Designers: Emily",
      "/group_photo.png",
    );
  };

  const handleHowToPlay = () => {
    showAlert(
      "How to Play",
      "Each player submits 5-10 word prompts." +
        " At the start of each round, two artists are randomly selected and given a prompt to draw." +
        " The rest of the players have a set time limit to guess both artists' prompts." +
        " The artist with the most correct guesses wins the round!" +
        " The player who guesses the fastest gains the most points!! Have fun doodlers!!",
    );
  };
  return (
    <div class="landing-page-body">
      <div style={{ position: "absolute", top: "10px", right: "10px" }}>
        <MuteButton
          onClick={() => {
            if (!AudioManager.isMuted())
              AudioManager.playLoop("/audio/DDsong.mp3");
          }}
        />
      </div>
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
        </div>
      </div>

      {/* Footer Navigation */}
      <div class="footer-nav">
        <div>
          <span class="version-text">Version 0.0.1</span>
          <span class="footer-link" onClick={() => handleCredits()}>
            credits
          </span>
          <span class="footer-link" onClick={() => handleHowToPlay()}>
            how to play
          </span>
        </div>
      </div>
      <Show when={alertModal()}>
        {(alert) => (
          <AlertModal {...alert()} onClose={() => setAlertModal(null)} />
        )}
      </Show>
      <Show when={promptModal()}>
        {(prompt) => (
          <PromptModal
            label={prompt().label}
            placeholder={prompt().placeholder}
            onClose={(value) => {
              const current = promptModal();
              setPromptModal(null);
              current?.onConfirm(value);
            }}
          />
        )}
      </Show>
    </div>
  );
}

export const LandingPage: Page = {
  async render(root: HTMLElement) {
    this.onEnd = render(() => <LandingMain />, root);
  },
};
