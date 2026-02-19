import { createSignal, onMount, For } from "solid-js";
import { insertCoin, onPlayerJoin } from "playroomkit";

export default function Lobby() {
  const [players, setPlayers] = createSignal([]);

  onMount(async () => {
    await insertCoin({ gameId: import.meta.env.VITE_GAME_ID });
    onPlayerJoin((player) => {
      const name = player.getProfile().name;
      setPlayers((prev) => [...prev, name]);
    });
  });

  return (
    <ul id="playerList">
      <For each={players()}>
        {(name) => <li>{name}</li>}
      </For>
    </ul>
  );
}