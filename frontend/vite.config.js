import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Production uses the identical /v1 rewrite in vercel.json. Keeping requests
// same-origin avoids a browser CORS dependency while Vercel forwards them to
// the Duedoh API.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/v1": {
        target: "https://duedoh-api.azurewebsites.net",
        changeOrigin: true,
      },
    },
  },
});
