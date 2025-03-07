import commonjs from "vite-plugin-commonjs";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react(), commonjs()],
  define: {
    global: "globalThis",
    "process.env": {},
  },
  resolve: {
    alias: {
      buffer: "buffer",
      crypto: "crypto-browserify",
      stream: "stream-browserify",
      util: "util",
      process: "process/browser",
      events: "events",
    },
  },
  optimizeDeps: {
    include: [
      "buffer",
      "process",
      "crypto-browserify",
      "stream-browserify",
      "util",
      "events",
    ],
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
      plugins: [],
    },
  },
  build: {
    rollupOptions: {
      plugins: [],
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
