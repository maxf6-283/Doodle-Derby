import "../../style/game.css"

interface CanvasButtonProps {
  icon: string;
  onClick: () => void;
  isActive: boolean;
  alt: string;
  size?: string; // Optional: pass a specific size like "50px"
  top : string;
  left : string;
  transparent? : boolean;
}

export function CanvasButton(props: CanvasButtonProps) {
  return (
    <button
      onClick={props.onClick}
      class="canvas-btn"
      style={{
        position: "relative", // Keeps the absolute image contained here
        width: "44px",        // Fixed container size
        height: "44px",       // Fixed container size
        padding : 0,
        background: props.isActive ? "#b54bf3" : props.transparent ? "transparent" : "white",
        cursor: "pointer",
        border : "none",
        "border-radius": "4px",
        display: "flex",
        "align-items": "center",
        "justify-content": "center",
        overflow: "visible",  // Allows the image to bleed out if it's huge
      }}
    >
      <img 
        src={props.icon} 
        alt={props.alt} 
        style={{
          position: "absolute",
          top: props.top,
          left: props.left,
          transform: "translate(-50%, -50%)", // Perfect centering
          width: props.size || "32px",       // Specific enlarged size
          height: props.size || "32px",
          "pointer-events": "none",           // Clicks go through to the button
     
        }} 
      />
    </button>
  );
}