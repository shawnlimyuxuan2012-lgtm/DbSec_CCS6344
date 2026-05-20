import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            const rawIp =
              req.headers["x-forwarded-for"] ||
              req.socket?.remoteAddress ||
              "127.0.0.1";
            const clientIp =
              rawIp.replace(/^::ffff:/, "").trim() === "::1"
                ? "127.0.0.1"
                : rawIp.replace(/^::ffff:/, "").trim();
            proxyReq.setHeader("x-forwarded-for", clientIp);
            proxyReq.setHeader("x-real-ip", clientIp);
          });
        },
      },
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            const rawIp =
              req.headers["x-forwarded-for"] ||
              req.socket?.remoteAddress ||
              "127.0.0.1";
            const clientIp =
              rawIp.replace(/^::ffff:/, "").trim() === "::1"
                ? "127.0.0.1"
                : rawIp.replace(/^::ffff:/, "").trim();
            proxyReq.setHeader("x-forwarded-for", clientIp);
            proxyReq.setHeader("x-real-ip", clientIp);
          });
        },
      },
    },
  },
});
