/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split vendored libraries into cacheable chunks so the entry stays
        // small and a page-level change never re-downloads React et al. Match
        // the specific libraries before the generic react rule.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("react-router")) return "vendor-router";
          if (id.includes("@tanstack")) return "vendor-query";
          if (
            id.includes("react-hook-form") ||
            id.includes("@hookform") ||
            id.includes("/zod/")
          ) {
            return "vendor-forms";
          }
          if (id.includes("@radix-ui")) return "vendor-radix";
          if (
            id.includes("/react-dom/") ||
            id.includes("/react/") ||
            id.includes("/scheduler/")
          ) {
            return "vendor-react";
          }
          return "vendor";
        },
      },
    },
  },
  server: {
    // Proxy the API through the dev server so the session cookie is same-origin
    // (no CORS, no SameSite headaches). Override the target with a full
    // VITE_API_URL if the backend lives elsewhere.
    proxy: {
      "/api": {
        target: process.env.VITE_PROXY_TARGET ?? "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    css: true,
  },
});
