import { createSignal, Show, For, onMount } from "solid-js";

export type AlertModalProps = {
  title?: string | null;
  message: string;
  imgSrc?: string;
};

export type PromptModalProps = {
  label: string;
  placeholder?: string;
};

export type PromptModalState = PromptModalProps & {
  onConfirm: (value: string | null) => void;
};

export function AlertModal(props: AlertModalProps & { onClose: () => void }) {
  const [closing, setClosing] = createSignal(false);
  function close() { setClosing(true); setTimeout(() => props.onClose(), 150); }
  const lines = () => props.message.split("\n");
  return (
    <div class={`dd-overlay${closing() ? " closing" : ""}`} onClick={(e) => e.target === e.currentTarget && close()}>
      <div class="dd-modal-wrapper">
        <div class={`dd-modal${closing() ? " closing" : ""}`}>
          <div class="dd-modal-content">
            <Show when={props.title}>
              <p class="dd-modal-title">{props.title}</p>
            </Show>
            <p class="dd-modal-message">
              <For each={lines()}>
                {(line, i) => <>{line}{i() < lines().length - 1 && <br />}</>}
              </For>
            </p>
            <Show when={props.imgSrc}>
              <img src={props.imgSrc} style={{
                display: "block",
                margin: "10px auto",
                width: "100%",
                "max-width": "100%",
                height: "auto",
              }} />
            </Show>
            <div class="dd-modal-buttons">
              <button class="dd-btn primary" onClick={close}>OK</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PromptModal(props: PromptModalProps & { onClose: (value: string | null) => void }) {
  const [closing, setClosing] = createSignal(false);
  let inputRef: HTMLInputElement | undefined;
  function close(value: string | null) { setClosing(true); setTimeout(() => props.onClose(value), 150); }
  function confirm() { close(inputRef?.value.trim() || null); }
  onMount(() => setTimeout(() => inputRef?.focus(), 0));
  return (
    <div class={`dd-overlay${closing() ? " closing" : ""}`} onClick={(e) => e.target === e.currentTarget && close(null)}>
      <div class={`dd-modal${closing() ? " closing" : ""}`}>
        <div class="dd-modal-content">
          <p class="dd-modal-message">{props.label}</p>
          <input ref={(el) => (inputRef = el)} class="dd-modal-input" type="text" placeholder={props.placeholder || "type here..."}
            onKeyDown={(e) => { if (e.key === "Enter") confirm(); if (e.key === "Escape") close(null); }} />
          <div class="dd-modal-buttons">
            <button class="dd-btn" onClick={() => close(null)}>Cancel</button>
            <button class="dd-btn primary" onClick={confirm}>OK</button>
          </div>
        </div>
      </div>
    </div>
  );
}

