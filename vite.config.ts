import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During `npm run dev`, requests to /api/portfolio/* are proxied so the
// frontend can talk to the FastAPI backend in development.
//
// Default target = the local backend (assumes `uvicorn main:app --port 27012`).
// To point at a deployed backend instead, set VITE_API_TARGET:
//   VITE_API_TARGET=https://yourdomain.com npm run dev
const API_TARGET = process.env.VITE_API_TARGET || "http://127.0.0.1:27012";

// If the target is the local backend, we strip the /api/portfolio prefix
// (FastAPI mounts endpoints at the root). For a remote target with nginx in
// front, keep the prefix (nginx rewrites server-side).
const STRIP_PREFIX =
  API_TARGET.includes("127.0.0.1") || API_TARGET.includes("localhost");

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // Chakra and framer-motion ship "use client" directives (for React Server
      // Components). They're meaningless in a Vite SPA, so don't print hundreds
      // of warnings about them.
      onwarn(warning, warn) {
        if (warning.code === "MODULE_LEVEL_DIRECTIVE") return;
        warn(warning);
      },
      // Long-lived vendor chunks: they change far less often than app code,
      // so browsers keep them cached across deploys.
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          chakra: ["@chakra-ui/react", "@emotion/react", "@emotion/styled"],
          motion: ["framer-motion"],
        },
      },
    },
  },
  server: {
    proxy: {
      "/api/portfolio": {
        target: API_TARGET,
        changeOrigin: true,
        secure: true,
        ...(STRIP_PREFIX
          ? { rewrite: (path: string) => path.replace(/^\/api\/portfolio/, "") }
          : {}),
      },
    },
  },
});
