import { createSignal, Show } from "solid-js";
import "../../style/lobby.css"

export interface IconButtonProps {
  defaultImg: string;
  hoverImg?: string;
  onClick: () => void;
  altText?: string;
  id?: string;
  text?: string;
  textColor? : string;
  width?: string | number;
  height?: string | number;
}

export function IconButton(props: IconButtonProps) {
  const [isHovered, setIsHovered] = createSignal(false);

  // Helper to ensure values have units (px) if passed as numbers
  const formatDim = (val?: string | number) => 
    typeof val === 'number' ? `${val}px` : val;
  console.log("IconButton props:", formatDim(props.width), formatDim(props.height));
  return (
    <button
      id={props.id}
      class="icon-btn"
      onClick={props.onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        "--btn-width": formatDim(props.width),
        "--btn-height": formatDim(props.height),
      }}
    >
      <img
        src={isHovered() && props.hoverImg ? props.hoverImg : props.defaultImg}
        alt={props.altText || "icon"}
        class="icon-btn__img"
      />

      <Show when={props.text}>
        <span class="icon-btn__text" style={{ "--text-color" : props.textColor || "inherit" }}>
          {props.text}
        </span>
      </Show>
    </button>
  );
}