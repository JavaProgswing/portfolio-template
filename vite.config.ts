import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During `npm run dev`, requests to /api/portfolio/* are proxied to the
// production backend so local dev sees real guestbook + spotify data.
// Override with VITE_API_TARGET env var to point at a local backend instead:
//   VITE_API_TARGET=http://127.0.0.1:27012 npm run dev
const API_TARGET =
  process.env.VITE_API_TARGET || "https://yashasviallen.is-a.dev";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/portfolio": {
        target: API_TARGET,
        changeOrigin: true,
        secure: true,
        // If pointing at the local backend on 27012, strip the /api/portfolio prefix.
        // If pointing at the production server, keep the prefix (nginx handles rewriting).
        ...(API_TARGET.includes("27012")
          ? { rewrite: (path: string) => path.replace(/^\/api\/portfolio/, "") }
          : {}),
      },
    },
  },
});
