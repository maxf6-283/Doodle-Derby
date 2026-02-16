// vite.config.ts
import { defineConfig } from "vite";

import solid from "vite-plugin-solid"

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: "index.html"
      },
    },
  },
  plugins: [solid()]
});
