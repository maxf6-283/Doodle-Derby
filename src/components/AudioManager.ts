import { createSignal } from "solid-js";
const [isMuted, setIsMuted] = createSignal(true);
const [volume, setVolume] = createSignal(0.3);

export const AudioManager = {
  isMuted,
  volume,
  toggleMute: () => {
    const newState = !isMuted();
    setIsMuted(newState);
    localStorage.setItem("muted", String(newState));
  },
  setVolume: (val: number) => {
    setVolume(val);
    localStorage.setItem("volume", String(val));
  },
  
  playSound: (src: string) => {
    if (isMuted()) return;
    const audio = new Audio(src);
    audio.volume = volume();
    audio.play().catch((err) => console.error("Audio playback failed:", err));
  },
  // Play a looping audio and return the HTMLAudioElement so caller can stop it.
  playLoop: (src: string) => {
    console.log(isMuted(), volume());
    if (isMuted()) return null;
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = volume();

    audio.play().catch((err) => console.error("Audio playback failed:", err));
    return audio;
  },
  // Stop a looping audio previously returned from `playLoop`.
  stopLoop: (audio: HTMLAudioElement | null) => {
    if (!audio) return;
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch (e) {
      console.error("Failed to stop audio loop:", e);
    }
  },
};
