import { createSignal, Show, For } from "solid-js";
import { render } from "solid-js/web";

// sheep

const sheepPool = [];
const MAX_POOL_SIZE = 500;

function getSheepFromPool() {
  if (sheepPool.length > 0) return sheepPool.pop();
  const totalSheep = document.querySelectorAll(".moving-sheep").length;
  if (totalSheep < MAX_POOL_SIZE) {
    const doodle = document.createElement("img");
    doodle.src = "/landing-page/sheep_loading.png";
    doodle.classList.add("moving-sheep");
    return doodle;
  }
  return null;
}

function spawnDoodle() {
  const doodle = getSheepFromPool();
  if (!doodle) return;
  const randomTop = Math.random() * 80;
  const randomDuration = 1 + Math.random() * 1.5;
  const randomSize = 30 + Math.random() * 100;
  const randomZ = Math.floor(Math.random() * 5) - 2;
  doodle.style.display = "block";
  doodle.style.top = `${randomTop}%`;
  doodle.style.width = `${randomSize}px`;
  doodle.style.opacity = "0.9";
  doodle.style.animation = "none";
  doodle.style.zIndex = randomZ;
  void doodle.offsetWidth;
  doodle.style.animation = `moveLeft ${randomDuration}s linear forwards`;
  if (!doodle.parentNode) document.body.appendChild(doodle);
  setTimeout(() => {
    doodle.style.display = "none";
    sheepPool.push(doodle);
  }, randomDuration * 1000);
}

//landing

export default function LandingPage() {
  const [logoClickCount, setLogoClickCount] = createSignal(0);
  const LOGO_CLICK_EVENT = 20;
  const EVENT_DURATION = 10;

  function handleLogoClick() {
    console.log("Logo clicked! Squish!");
    const next = logoClickCount() + 1;
    setLogoClickCount(next);
    if (next >= LOGO_CLICK_EVENT) {
      console.log("unlocked secret easter egg!");
      const sheepInterval = setInterval(spawnDoodle, 50);
      setTimeout(() => clearInterval(sheepInterval), EVENT_DURATION * 1000);
      setLogoClickCount(0);
    }
  }

  async function handleJoin() {
    const code = await ddPrompt("Enter Game Code:", "e.g. ABC123");
    if (!code) return;
    const baseUrl = window.location.origin + "/lobby.html";
    window.location.replace(`${baseUrl}#r=${code}`);
  }

  function handleCredits() {
    ddAlert("Credits!!",
      "Artists: Allie, Jay, Marissa, and Bella\n" +
      "Programmers: Neel, Seven, Zidane, Isha, Allie\n" +
      "Audio: Jay\n" +
      "Designers: Zidane and Emily"
    );
  }

  function handleHowToPlay() {
    ddAlert("How to Play",
      "Each player submits 5-10 word prompts.\n" +
      "At the start of each round, two artists are randomly selected and given a prompt to draw.\n" +
      "The rest of the players have a set time limit to guess both artists' prompts.\n" +
      "The artist with the most correct guesses wins the round!\n" +
      "The player who guesses the fastest gains the most points!! Have fun doodlers!!"
    );
  }

  return (
    <>
      <div class="game-wrapper">
        <button class="logo-button" onClick={handleLogoClick}>
          <img src="/landing-page/logo.png" alt="Apple Doodle" class="logo-img" />
          <div class="logo-shadow"></div>
        </button>
      </div>

      <div class="footer-nav">
        <div>
          <span class="version-text">Version 0.0.0</span>
          <span class="footer-link" onClick={handleCredits}>credits</span>
          <span class="footer-link" onClick={handleHowToPlay}>how to play</span>
        </div>
        <div class="button-container">
          <button class="image-button" onClick={() => window.location.href = "lobby.html"}>
            <img src="/landing-page/create_button_flat.png" alt="Create Lobby" class="btn-idle" />
            <img src="/landing-page/create_button_hover.png" alt="Create Lobby Hover" class="btn-hover" />
          </button>
          <button class="image-button" onClick={handleJoin}>
            <img src="/landing-page/join_button_flat.png" alt="Join Lobby" class="btn-idle" />
            <img src="/landing-page/join_button_hover.png" alt="Join Lobby Hover" class="btn-hover" />
          </button>
        </div>
      </div>
    </>
  );
}


function mountModal(Component, props) {
  return new Promise((resolve) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const dispose = render(
      () => <Component {...props} onClose={(value) => { dispose(); container.remove(); resolve(value); }} />,
      container
    );
  });
}

function AlertModal(props) {
  const [closing, setClosing] = createSignal(false);
  function close() { setClosing(true); setTimeout(() => props.onClose(undefined), 150); }
  const lines = () => props.message.split("\n");
  return (
    <div class={`dd-overlay${closing() ? " closing" : ""}`} onClick={(e) => e.target === e.currentTarget && close()}>
      <div class={`dd-modal${closing() ? " closing" : ""}`}>
        <Show when={props.title}>
          <p class="dd-modal-title">{props.title}</p>
        </Show>
        <p class="dd-modal-message">
          <For each={lines()}>
            {(line, i) => <>{line}{i() < lines().length - 1 && <br />}</>}
          </For>
        </p>
        <div class="dd-modal-buttons">
          <button class="dd-btn primary" onClick={close}>OK</button>
        </div>
      </div>
    </div>
  );
}

function PromptModal(props) {
  const [closing, setClosing] = createSignal(false);
  let inputRef;
  function close(value) { setClosing(true); setTimeout(() => props.onClose(value), 150); }
  function confirm() { close(inputRef.value.trim() || null); }
  setTimeout(() => inputRef?.focus(), 100);
  return (
    <div class={`dd-overlay${closing() ? " closing" : ""}`} onClick={(e) => e.target === e.currentTarget && close(null)}>
      <div class={`dd-modal${closing() ? " closing" : ""}`}>
        <p class="dd-modal-message">{props.label}</p>
        <input ref={inputRef} class="dd-modal-input" type="text" placeholder={props.placeholder || "type here..."}
          onKeyDown={(e) => { if (e.key === "Enter") confirm(); if (e.key === "Escape") close(null); }} />
        <div class="dd-modal-buttons">
          <button class="dd-btn" onClick={() => close(null)}>Cancel</button>
          <button class="dd-btn primary" onClick={confirm}>OK</button>
        </div>
      </div>
    </div>
  );
}

function ddAlert(titleOrMsg, message) {
  const title = message !== undefined ? titleOrMsg : null;
  const msg = message !== undefined ? message : titleOrMsg;
  return mountModal(AlertModal, { title, message: msg });
}

function ddPrompt(label, placeholder = "") {
  return mountModal(PromptModal, { label, placeholder });
}