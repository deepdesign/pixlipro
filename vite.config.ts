import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";
import spriteCollectionsPlugin from "./vite-plugin-sprite-collections";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read version from package.json
const packageJson = JSON.parse(
  readFileSync(path.resolve(__dirname, "package.json"), "utf-8"),
);
const version = packageJson.version;

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    // Auto-generate sprite collections when files change
    spriteCollectionsPlugin(),
    // Bundle analyzer (only in analyze mode)
    mode === "analyze" &&
      visualizer({
        open: true,
        filename: "dist/stats.html",
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // Polyfill for Node.js 'os' module that SVGO tries to use
      "os": path.resolve(__dirname, "src/lib/polyfills/os.js"),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      // Handle CommonJS modules used by SVGO (like boolbase)
      mainFields: ['module', 'main'],
    },
    // Force include CommonJS dependencies that SVGO uses
    include: ['boolbase', 'css-tree', 'csso'],
  },
  define: {
    __APP_VERSION__: JSON.stringify(version),
    // Polyfill for Node.js modules that SVGO might try to use
    'process.platform': JSON.stringify('browser'),
  },
  server: {
    port: 5174,
  },
  preview: {
    port: 5174,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries into separate chunks
          "react-vendor": ["react", "react-dom"],
          "radix-vendor": [
            "@radix-ui/react-select",
            "@radix-ui/react-slider",
            "@radix-ui/react-switch",
            "@radix-ui/react-accordion",
          ],
          "p5-vendor": ["p5"],
          "icons-vendor": ["lucide-react"],
        },
      },
    },
  },
}));
