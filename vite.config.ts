// vite.config.ts
import { defineConfig } from "vite";

import solid from "vite-plugin-solid"

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: "../dist",
    rollupOptions: {
      input: {
        main: "src/index.html"
      },
    },
  },
  plugins: [solid()]
});
