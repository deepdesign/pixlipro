import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";

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
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(version),
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
