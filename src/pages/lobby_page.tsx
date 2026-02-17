import {
  getParticipants,
  getRoomCode,
  isHost,
  myPlayer,
  setState,
  getState,
  RPC,
  PlayerState,
  insertCoin,
  onDisconnect
} from "playroomkit";

import { Page } from "../../api/page";
import { routerNavigate } from "../../api/tiny_router";
import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { render } from "solid-js/web";

import "../../style/lobby.css"

const DEFAULT_TIMER = 30;
const MIN_TIMER = 15;
const MAX_TIMER = 180;
const TIME_INCREMENT = 15;

const CHARACTER_PATHS = [
  "/characters/bear_icon.png",
  "/characters/bunny_icon.png",
  "/characters/chameleon_icon.png",
  "/characters/dog_icon.png",
  "/characters/fish_icon.png",
  "/characters/puppy_icon.png",
  "/characters/sheep_icon.png",
  "/characters/timmy_icon.png",
];

const ASSORTMENTS = [
  [
    "/accessories/top_hat.PNG",
    "/accessories/chef.PNG",
    "/accessories/clown.PNG",
    "/accessories/red_access.PNG",
  ],
  [
    "/accessories/shades.PNG",
    "/accessories/moustache.PNG",
    "/accessories/glasses.PNG",
    "/accessories/bow_tie.PNG",
    "/accessories/red_access.PNG",
  ],
  [
    "/accessories/boba.PNG",
    "/accessories/fishBowl.PNG",
    "/accessories/red_access.PNG",
  ],
];

export const [lobbyTicket, setLobbyTicket] = createSignal(0);
export const refreshLobby = () => setLobbyTicket((t) => t + 1);

export const LobbyPage: Page = {
  async render(root: HTMLElement) {

    // TODO: If restarting the game with entire lobby
    //       from previous game, we shouldn't call insertCoin
    //       again.
    try {
      await insertCoin({
        gameId: process.env.GAME_ID,
        skipLobby: true,
      });
      window.location.href = "/#r=R" + getRoomCode();
    } catch {
      // we have been kicked
      alert("Permission denied - you have been kicked");
      routerNavigate("/");
    }

    onDisconnect((ev) => {
      alert(`Kicked from room: ${ev.reason}`);
      routerNavigate("/");
    });

    this.onEnd = render(() => <Lobby />, root);
  },
};

function Lobby() {
  // Local state for UI visibility
  const [isCustomizeOpen, setIsCustomizeOpen] = createSignal(false);
  const [isSettingsOpen, setIsSettingsOpen] = createSignal(false);
  const [currentTimer, setCurrentTimer] = createSignal(DEFAULT_TIMER);
  const [isKickOpen, setIsKick] = createSignal<PlayerState | null>(null);

  const resetKickButton = () => {
    if (isKickOpen()) {
      setIsKick(null);
    }
  }

  onMount(() => {
    const interval = setInterval(() => {
      // This will only trigger updates in parts of the JSX
      // that specifically call lobbyTicket()
      setLobbyTicket((t) => t + 1);
    }, 1000);

    const settingsSync = setInterval(() => {
      setCurrentTimer(getState("timer-seconds") ?? DEFAULT_TIMER);
    }, 100);

    const me = myPlayer();
    if (!me.getState("character")) {
      const randomChar =
        CHARACTER_PATHS[Math.floor(Math.random() * CHARACTER_PATHS.length)];
      me.setState("character", randomChar);
    }
    // Sync Playroom state changes to Solid's reactivity

    RPC.register("refresh_lobby_ui", async () => refreshLobby());

    RPC.register("start-game", async () => {
      routerNavigate("/pick-words");
    });

    // Ensure host is set on mount
    if (isHost()) {
      setState("hostId", myPlayer().id);
    }

    onCleanup(() => {
      clearInterval(interval)
      clearInterval(settingsSync);
    });
  });

  const toggleReady = () => {
    const me = myPlayer();
    me.setState("isReady", !me.getState("isReady"));
    // Tell everyone (including yourself) to refresh the UI
    RPC.call("refresh_lobby_ui", {}, RPC.Mode.ALL);
  };

  const players = () => {
    lobbyTicket(); // Reactive dependency
    return Object.values(getParticipants());
  };

  const handleStart = () => {
    const pList = players();
    if (pList.every((p) => p.getState("isReady")) && pList.length >= 3) {
      setState("game-started", true, true);
      RPC.call("start-game", {}, RPC.Mode.ALL);
    } else {
      alert("Need 3+ players and everyone must be ready!");
    }
  };

  return (
    <div id="mainLobby-container" class="lobby-container">
      {/* Header */}
      <header class="lobby-header">
        <IconButton
          id="exit-btn"
          defaultImg="/lobby/back_icon.png"
          hoverImg="/lobby/back_icon_highlighted.png"
          altText="Back"
          onClick={() => {
            myPlayer().leaveRoom();
            routerNavigate("/");
          }}
        />
        <h1>
          Code: <span id="code-span">{getRoomCode() ?? "Error"}</span>
        </h1>
        <IconButton
          id="settings-btn"
          defaultImg="/lobby/settings_icon.png"
          hoverImg="/lobby/settings_icon_highlighted.png"
          altText="Settings"
          onClick={() => {
            resetKickButton();
            setIsSettingsOpen(true);
          }}
        />
      </header>

      {/* Main Content */}
      <main class="lobby-content">
        <aside class="sticky-note rules-note">
          <h3>RULES:</h3>
          <ul>
            <li>Number of Rounds: 3</li>
            <li>
              Time Limit:{" "}
              {(() => {
                lobbyTicket(); // Listen for changes
                return currentTimer();
              })()}
              s
            </li>
          </ul>
        </aside>

        <div class="player-grid">
          <For each={players()}>
            {(player) => {
              return (
                <div>
                  <PlayerCard
                    player={player}
                    onKick={() => {
                      if (player.id != getState("hostId")) {
                        setIsKick(prevPlayer => {
                          if (prevPlayer?.id === player.id) return null;
                          return player;
                        })
                      }
                    }}
                    onCustomize={() => {
                      resetKickButton();
                      setIsCustomizeOpen(true);
                    }}
                  />
                  <Show when={isHost() && player.id === isKickOpen()?.id}>
                    <KickButton player={player} />
                  </Show>
                </div>
              );
            }}
          </For>
        </div>
      </main>

      {/* Footer */}
      <footer class="lobby-footer">
        <div class="ready-count">
          {players().filter((p) => p.getState("isReady")).length}/
          {players().length} READY
        </div>
        <div class="button-group">
          <button
            class="ready-btn"
            onClick={() => {
              toggleReady();
            }}
          >
            {(() => {
              lobbyTicket(); // Listen for changes
              return myPlayer().getState("isReady") ? "UNREADY" : "READY";
            })()}
          </button>

          <Show when={isHost()}>
            <button class="start-btn" onClick={handleStart}>
              START &gt;&gt;
            </button>
          </Show>
        </div>
      </footer>

      {/* Modals */}
      <Show when={isCustomizeOpen()}>
        <CustomizeModal onClose={() => setIsCustomizeOpen(false)} />
      </Show>
      <Show when={isSettingsOpen()}>
        <SettingsModal timerSeconds={currentTimer()} onClose={() => setIsSettingsOpen(false)} />
      </Show>
    </div>
  );
}

interface PlayerCardProps {
  player: PlayerState; // Ideally use PlayerState from playroomkit if available
  onKick: () => void;
  onCustomize: () => void;
}

interface CustomizeModalProps {
  onClose: () => void;
}

function PlayerCard(props: PlayerCardProps) {
  const isMe = () => props.player.id === myPlayer().id;
  const char = () => {
    lobbyTicket();
    return props.player.getState("character") || CHARACTER_PATHS[0];
  };
  const isReady = () => {
    lobbyTicket();
    return props.player.getState("isReady");
  };

  const clickPlayerButton = () => {
    if (isMe()) {
      props.onCustomize();
      return;
    }
    if (isHost()) {
      props.onKick();
    }
  }

  return (
    <div class="player-slot">
      <Show when={props.player.id === getState("hostId")}>
        <img src="/lobby/crown.png" class="crown-img" alt="Host Crown" />
      </Show>

      <button
        class="player-button"
        onClick={() => clickPlayerButton()}
      >
        <div class="stick-man">
          <img src={char()} style="width:100%; height:100%;" />
          <For each={[0, 1, 2]}>
            {(idx) => {
              // Re-evaluate accessory path on every tick
              const accPath = () => {
                lobbyTicket();
                return props.player.getState(`acc_${idx}`);
              };
              return (
                <Show when={accPath()}>
                  <div
                    class="acc-layer"
                    style={{ "background-image": `url(${accPath()})` }}
                  />
                </Show>
              );
            }}
          </For>
        </div>
      </button>

      <Show when={isReady()}>
        <div class="ready-tag">READY!</div>
      </Show>
      <p>
        {(() => {
          lobbyTicket(); // Subscribe to the tick
          return props.player.getState("name") || "Player";
        })()}
        {isMe() ? " (You)" : ""}
      </p>
    </div>
  );
}

function CustomizeModal(props: CustomizeModalProps) {
  const [name, setName] = createSignal(myPlayer().getState("name") || "");
  const [showPicker, setShowPicker] = createSignal(false);
  const [activeSlot, setActiveSlot] = createSignal<number | null>(null);
  const [pickerPos, setPickerPos] = createSignal({ x: 0, y: 0 });

  const updateName = (val: string) => {
    setName(val);
    myPlayer().setState("name", val);
    RPC.call("refresh_lobby_ui", {}, RPC.Mode.ALL);
  };

  const myChar = () => {
    lobbyTicket(); // Subscribe to updates
    return myPlayer().getState("character") || CHARACTER_PATHS[0];
  };

  const handleOpenPicker = (e: MouseEvent, index: number) => {
    setPickerPos({ x: e.clientX, y: e.clientY });
    setActiveSlot(index);
    setShowPicker(true);
  };

  const selectItem = (path: string) => {
    const slot = activeSlot(); // -1 for character, 0-2 for accessories

    if (slot === -1) {
      myPlayer().setState("character", path);
    } else {
      // Convert preview path to high-res equip path
      const equipPath = path.replace("/accessories/", "/accessories-equip/");
      // "red_access.PNG" is usually your "remove" icon
      const finalPath = path.includes("red_access.PNG") ? "" : equipPath;
      myPlayer().setState(`acc_${slot}`, finalPath);
    }

    setShowPicker(false);
    RPC.call("refresh_lobby_ui", {}, RPC.Mode.ALL);
  };

  const currentItems = () => {
    const slot = activeSlot();
    if (slot === -1) return CHARACTER_PATHS;
    if (slot !== null) return ASSORTMENTS[slot];
    return [];
  };

  return (
    <div class="modal" style={{ display: "flex" }}>
      <div class="modal-content">
        <span class="close" onClick={props.onClose}>
          &times;
        </span>

        <div class="customization-body">
          <div class="name-group">
            <input
              type="text"
              value={name()}
              onInput={(e) => updateName(e.currentTarget.value)}
              placeholder="YOUR NAME"
              maxlength="16"
            />
          </div>

          <div class="preview-section">
            <button
              class="preview-button-wrapper"
              onClick={(e) => handleOpenPicker(e, -1)}
            >
              <div class="stick-man preview-size">
                <img
                  src={myChar()}
                  style="width:100%; height:100%; object-fit:contain;"
                />
                <For each={[0, 1, 2]}>
                  {(idx) => {
                    const myAccPath = () => {
                      lobbyTicket(); // Force reactivity
                      return myPlayer().getState(`acc_${idx}`);
                    };
                    return (
                      <Show when={myAccPath()}>
                        <div
                          class="acc-layer"
                          style={{
                            "background-image": `url(${myAccPath()})`,
                            "z-index": idx === 0 ? 10 : idx === 1 ? 15 : 5,
                          }}
                        />
                      </Show>
                    );
                  }}
                </For>
              </div>
            </button>
          </div>

          <div class="accessory-slots-container">
            <For each={[0, 1, 2]}>
              {(idx) => (
                <div
                  class="accessory-slot"
                  onClick={(e) => handleOpenPicker(e, idx)}
                >
                  <div class="slot-label">
                    {idx === 0 ? "HAT" : idx === 1 ? "FACE" : "ITEM"}
                  </div>
                  <div class="slot-display">
                    {(() => {
                      lobbyTicket(); // Listen for changes
                      const path = myPlayer().getState(`acc_${idx}`);
                      return (
                        <Show when={path}>
                          <img src={path.replace("-equip", "")} />
                        </Show>
                      );
                    })()}
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>

        {/* The Accessory Picker integrated as a reactive Solid element */}
        <Show when={showPicker()}>
          <div
            class="picker-popup"
            style={{
              top: `${pickerPos().y}px`,
              left: `${pickerPos().x}px`,
              transform: "translate(-50%, -100%) rotate(-1deg)",
            }}
          >
            <div class="picker-header">
              <span>SELECT {activeSlot() === -1 ? "CHARACTER" : "ITEM"}</span>
              <button class="close-small" onClick={() => setShowPicker(false)}>
                &times;
              </button>
            </div>
            <div class="picker-grid">
              <For each={currentItems()}>
                {(path) => (
                  <div class="picker-item" onClick={() => selectItem(path)}>
                    <img src={path} />
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}

//TODO: STYLE THIS W/ CSS MAGIC!!!
function KickButton(props: { player: PlayerState }) {
  return (
    <button
      id="kick-btn"
      onclick={() => {
        props.player.kick();
      }}
      style={{
        display: "block",
      }}>
      Kick
    </button>
  );
}

function SettingsModal(props: { timerSeconds: number, onClose: () => void }) {
  const updateTime = (amt: number) => {
    if (!isHost()) return;
    const current = getState("timer-seconds") ?? 30;
    setState("timer-seconds", Math.max(MIN_TIMER, Math.min(MAX_TIMER, current + amt)));
    RPC.call("refresh_lobby_ui", {}, RPC.Mode.ALL);
  };

  return (
    <div id="settingsMenu" class="modal" style={{ display: "flex" }}>
      <div class="modal-content">
        <span class="close" onClick={props.onClose}>
          &times;
        </span>
        <div class="customization-body">
          <div id="timerContainer">
            <label>Timer per round:</label>
            <div id="custom-timer-display">
              <button onClick={() => updateTime(-TIME_INCREMENT)}>&lt;</button>
              <span>{props.timerSeconds}s</span>
              <button onClick={() => updateTime(TIME_INCREMENT)}>&gt;</button>
            </div>
          </div>

          //TODO: VOLUME SHOULD BECOME A SIGNAL THAT IS UPDATED
          //      BASED ON MULTIPLAYER STATE!

          <div id="volumeContainer">
            <label>Volume</label>
            <input type="range" id="volumeSlider" min="0" max="100" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface IconButtonProps {
  defaultImg: string;
  hoverImg: string;
  onClick: () => void;
  altText?: string;
  id?: string;
}

function IconButton(props: IconButtonProps) {
  // 1. Local signal to track hover state for this specific button
  const [isHovered, setIsHovered] = createSignal(false);

  return (
    <button
      id={props.id}
      class="icon-btn"
      onClick={props.onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        // 2. Dynamically swap the src based on the hover signal
        src={isHovered() ? props.hoverImg : props.defaultImg}
        width="100px"
        alt={props.altText || "icon"}
      />
    </button>
  );
}
