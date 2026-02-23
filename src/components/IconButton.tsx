import { createSignal } from "solid-js";

export interface IconButtonProps {
  defaultImg: string;
  hoverImg: string;
  onClick: () => void;
  altText?: string;
  id?: string;
}

export function IconButton(props: IconButtonProps) {
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
        width="80px"
        alt={props.altText || "icon"}
      />
    </button>
  );
}
