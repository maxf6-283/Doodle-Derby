import { getParticipants, myPlayer, getState, PlayerState } from "playroomkit";

import { Page } from "../../api/page";
import { routerNavigate } from "../../api/tiny_router";
import { render } from "solid-js/web";
import { createSignal, onMount, Show, For, Setter, Accessor } from "solid-js";

import "../../style/podium-page.css";

function PlayerCard({
  player,
  playerScale,
}: {
  player: PlayerState;
  playerScale: Accessor<number>;
}) {
  const name = player.getState("name") ?? "Guest";
  const characterImg = player.getState("character");
  const accessories: string[] = [
    player.getState("acc_0"),
    player.getState("acc_1"),
    player.getState("acc_2"),
  ].filter((a) => a);
  const score = player.getState("score") ?? 0;

  return (
    <div class="player-score-card" style={{ scale: playerScale() }}>
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

function Podium({
  src,
  player,
  width,
  playerScale,
}: {
  src: Accessor<string | null>;
  player: PlayerState | null;
  width: number;
  playerScale: Accessor<number>;
}) {
  console.log("Rerendered");
  return (
    <Show when={player != null}>
      <div class="podium" style={{ width: `${width}px` }}>
        <PlayerCard player={player as PlayerState} playerScale={playerScale} />
        <img src={src() as string}></img>
      </div>
    </Show>
  );
}

const images = import.meta.glob("/public/podium/*.png", {
  eager: true,
  import: "default", // get the final URL
});

const imageUrls = Object.values(images) as string[];

function PodiumPageMain() {
  const [firstPlace, setFirstPlace] = createSignal<PlayerState | null>(null);
  const [secondPlace, setSecondPlace] = createSignal<PlayerState | null>(null);
  const [thirdPlace, setThirdPlace] = createSignal<PlayerState | null>(null);

  const [firstPlaceScale, setFirstPlaceScale] = createSignal<number>(0);
  const [secondPlaceScale, setSecondPlaceScale] = createSignal<number>(0);
  const [thirdPlaceScale, setThirdPlaceScale] = createSignal<number>(0);

  const [firstImage, setFirstImage] = createSignal<string | null>(null);
  const [secondImage, setSecondImage] = createSignal<string | null>(null);
  const [thirdImage, setThirdImage] = createSignal<string | null>(null);

  onMount(() => {
    const players = Object.values(getParticipants());

    let firstPlaceScore = -1;
    let secondPlaceScore = -1;
    let thirdPlaceScore = -1;

    for (let player of players) {
      let score = player.getState("score") ?? 0;
      if (score > firstPlaceScore) {
        console.log("First place set");
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

    imageUrls.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    const next_img = (
      prefix: string,
      idx: number,
      max: number,
      setter: Setter<string | null>,
      done: () => void,
    ) => {
      setter(`${prefix}${idx}.png`);
      console.log(`setting ${prefix}${idx}.png`);
      if (idx < max)
        setTimeout(() => next_img(prefix, idx + 1, max, setter, done), 300);
      else done();
    };

    setTimeout(() => {
      next_img("/podium/Third_podium_", 1, 4, setThirdImage, () =>
        setThirdPlaceScale(1),
      );
    }, 0);
    setTimeout(() => {
      next_img("/podium/Second_podium_", 1, 5, setSecondImage, () =>
        setSecondPlaceScale(1),
      );
    }, 1000);
    setTimeout(() => {
      next_img("/podium/First_podium_", 1, 6, setFirstImage, () =>
        setFirstPlaceScale(1),
      );
    }, 3000);
  });

  return (
    <div class="podium-container">
      <Podium
        src={secondImage}
        player={secondPlace()}
        playerScale={secondPlaceScale}
        width={415}
      />
      <Podium
        src={firstImage}
        player={firstPlace()}
        playerScale={firstPlaceScale}
        width={500}
      />
      <Podium
        src={thirdImage}
        player={thirdPlace()}
        playerScale={thirdPlaceScale}
        width={415}
      />
    </div>
  );
}

export const PodiumPage: Page = {
  async render(root: HTMLElement) {
    this.onEnd = render(() => <PodiumPageMain />, root);
  },
};
