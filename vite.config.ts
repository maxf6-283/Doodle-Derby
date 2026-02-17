// vite.config.ts
import { defineConfig } from "vite";

import solid from "vite-plugin-solid"

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    rollupOptions: {
      input: {
        main: "index.html"
      },
    },
  },
  plugins: [solid()]
});
