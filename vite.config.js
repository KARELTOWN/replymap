import { defineConfig } from "vite";
export default defineConfig({
  server: {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
      credentials: true,
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Access-Control-Allow-Headers",
        "Access-Control-Allow-Origin",
        "common",
      ],
    },
  },
});
