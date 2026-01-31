// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        lobby: "lobby.html",
        canvas: "canvas.html",
      },
    },
  },
});