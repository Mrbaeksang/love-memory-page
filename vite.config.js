import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-512.png", "icon-192.png"],
      manifest: {
        name: "Love Memory",
        short_name: "Love Memory",
        description: "우리가 함께한 시간, Love Memory",
        start_url: "/",
        display: "standalone",
        background_color: "#fdf6e3",
        theme_color: "#ffffff",
        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ]
});
