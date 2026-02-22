import { getParticipants, myPlayer, getState, PlayerState } from "playroomkit";

import { Page } from "../../api/page";
import { routerNavigate } from "../../api/tiny_router";
import { render } from "solid-js/web";
import { createSignal, onMount, Show, For } from "solid-js";

import "../../style/podium-page.css";

function PlayerCard({ player }: { player: PlayerState }) {
  const name = player.getState("name") || "Guest";
  const characterImg = player.getState("character");
  const accessories: string[] = [
    player.getState("acc_0"),
    player.getState("acc_1"),
    player.getState("acc_2"),
  ].filter((a) => a);
  const score = player.getState("score");

  return (
    <div class="player-score-card">
      <span class="player-name-label">
        {" "}
        {name} {player.id === myPlayer().id ? "(You)" : ""}{" "}
      </span>
      <div class="player-icon-wrapper">
        <div class="mini-stick-man">
          {characterImg ? (
            <img src={`${characterImg}`} class="base-char" />
          ) : (
            "ツ"
          )}
          <For each={accessories}>
            {(acc) => {
              acc = acc.replace("/accessories/", "/accessories-equip/");
              return <img src={acc} class="acc-layer" />;
            }}
          </For>
        </div>
      </div>
      <span class="player-score">
        {"score: "}
        {score}
      </span>
    </div>
  );
}

function Podium({ src, player }: { src: string; player: PlayerState | null }) {
  return (
    <Show when={player != null}>
      <div class="podium">
        <PlayerCard player={player as PlayerState} />
        <img src={src}></img>
      </div>
    </Show>
  );
}

function PodiumPageMain() {
  const [firstPlace, setFirstPlace] = createSignal<PlayerState | null>(null);
  const [secondPlace, setSecondPlace] = createSignal<PlayerState | null>(null);
  const [thirdPlace, setThirdPlace] = createSignal<PlayerState | null>(null);

  onMount(() => {
    const players = Object.values(getParticipants());

    let firstPlaceScore = -1;
    let secondPlaceScore = -1;
    let thirdPlaceScore = -1;

    for (let player of players) {
      let score = player.getState("score");
      if (score > firstPlaceScore) {
        firstPlaceScore = score;
        setFirstPlace(player);
      } else if (score > secondPlaceScore) {
        secondPlaceScore = score;
        setSecondPlace(player);
      } else if (score > thirdPlaceScore) {
        thirdPlaceScore = score;
        setThirdPlace(player);
      }
    }
  });

  return (
    <div class="podium-container">
      <Podium src="/podium/podium-2nd.png" player={secondPlace()} />
      <Podium src="/podium/podium-1st.png" player={firstPlace()} />
      <Podium src="/podium/podium-3rd.png" player={thirdPlace()} />
    </div>
  );
}

export const PodiumPage: Page = {
  async render(root: HTMLElement) {
    this.onEnd = render(() => <PodiumPageMain />, root);
  },
};
