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
  // Vendor code is left to Vite/Rollup's automatic chunking. A hand-rolled
  // manualChunks() split (React / motion / router / … each into its own chunk)
  // produced a circular chunk dependency (vendor <-> vendor-react) whose
  // cross-chunk top-level init order was undefined at runtime — white-screening
  // the PRODUCTION build with "Cannot read properties of undefined (reading
  // 'Component')" (motion/react touching React before its chunk initialized)
  // and, once motion was folded in, "Cannot access '_' before initialization".
  // Only the Rollup bundle reproduced it; the dev server and Vitest use native
  // ESM with no chunking. Automatic chunking orders modules by the real
  // dependency graph, so it cannot create that cycle. Route-level splitting is
  // still handled by the lazy() imports in router.tsx.
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
