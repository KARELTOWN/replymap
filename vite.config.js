import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5174,
    cors: {
      origin: "*", // Allow every origin
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
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
  build: {
    rollupOptions: {
      input: "./src/record.js", // Entry point of the widget
      output: {
        entryFileNames: "record.js", // Name of the built file
      },
    },
    outDir: "dist", // Output folder
    emptyOutDir: true, // Clears the folder before each build
  },
});
