import { getParticipants, PlayerState, myPlayer } from "playroomkit";
import { For, createMemo } from "solid-js";
import { PlayerAvatar } from "./PlayerAvatar";

export function PlayerList() {
  // Memoize the players list to handle reactivity when players join/leave or scores change
  const players = createMemo(() => Object.values(getParticipants()));

  return (
    <div style={{
      display: "flex",
      "flex-direction": "column",
      gap: "12px",
      padding: "16px",
      background: "rgba(0, 0, 0, 0.1)",
      "border-radius": "16px",
      "max-width": "300px"
    }}>
      <For each={players()}>
        {(player: PlayerState) => {
          // Retrieve player state values
          const name = () => player.getState("name") || "Guest";
          const score = () => player.getState("score") ?? 0;
          const isMe = player.id === myPlayer().id;

          return (
            <div style={{
              display: "flex",
              "align-items": "center",
              gap: "12px",
              padding: "8px",
              background: isMe ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.1)",
              "border-radius": "12px",
              border: isMe ? "2px solid #fff" : "none"
            }}>
              {/* Reusable Avatar Component */}
              <PlayerAvatar player={player} />

              <div style={{
                display: "flex",
                "flex-direction": "column",
                "justify-content": "center"
              }}>
                <span style={{
                  "font-weight": "bold",
                  color: "#fff",
                  "font-size": "1.1rem"
                }}>
                  {name()} {isMe ? "(You)" : ""}
                </span>
                <span style={{
                  color: "rgba(255, 255, 255, 0.8)",
                  "font-size": "0.9rem"
                }}>
                  {score()} points
                </span>
              </div>
            </div>
          );
        }}
      </For>
    </div>
  );
}