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
      "Producer – Allie Atkinson\n" +
      "Programmers – Seven Flaminiano, Max Fisch, Zidane Ho, Neel Dharm, Adrian Guzman, Isha Pandit, Gloria Lee, Michelle Mitchell, Jack Park\n" +
      "Artists – Marissa Morales, Jay Siqueiroz, Bella Lau, Allie Atkinson\n" +
      "Audio – Jay Siqueiroz, Jason Montanez\n" +
      "Design – Emily Le, Zidane Ho\n",
      "group_photo.png"
    );
  }

  function handleHowToPlay() {
    ddAlert("How to Play",
      "Start by creating a lobby and inviting at least two friends!" +
      " The game will begin by everyone writing word prompts that are drawable." +
       " They can be simple, like “apple pie,” or more personal to your friend group, like “Allie’s cat.”" +
       " After everybody has submitted words, the drawing will begin! If you are an artist, draw your prompt" +
       " accurately and quickly to win the round. If you are in the audience, try to guess both artists’ prompts" +
       " (they’re different!). Faster guesses = more points. " +
       "At the end of the game, a winner will be declared. Let’s doodle!"
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
      <div class="dd-modal-wrapper">
      <div class={`dd-modal${closing() ? " closing" : ""}`}>
        <Show when={props.title}>
          <p class="dd-modal-title">{props.title}</p>
        </Show>
        <p class="dd-modal-message">
          <For each={lines()}>
            {(line, i) => <>{line}{i() < lines().length - 1 && <br />}</>}
          </For>
        </p>
        <show when={props.imgSrc}>
          <img src={props.imgSrc} style ={{
            display: "block",
            margin: "10px auto",
            "max-width": "380px",
            height: "auto",
          }} />
        </show>
        <div class="dd-modal-buttons">
          <button class="dd-btn primary" onClick={close}>OK</button>
          </div>
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

function ddAlert(titleOrMsg, message, imgSrc = null) {
  const title = message !== undefined ? titleOrMsg : null;
  const msg = message !== undefined ? message : titleOrMsg;
  return mountModal(AlertModal, { title, message: msg, imgSrc });
}

function ddPrompt(label, placeholder = "") {
  return mountModal(PromptModal, { label, placeholder });
}