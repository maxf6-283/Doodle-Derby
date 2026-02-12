// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        game: "game.html",
        lobby: "lobby.html",
        canvas: "canvas.html",
        "pick-words": "pick-words.html",
        waiting: "waiting.html",
      },
    },
  },
});