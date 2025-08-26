import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5174,
    cors: {
      origin: "*", // Autorise toutes les origines
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
      input: "./src/record.js", // Chemin vers ton fichier source
      output: {
        entryFileNames: "record.js", // Nom du fichier généré
      },
    },
    outDir: "dist", // Dossier de sortie
    emptyOutDir: true, // Nettoie le dossier avant chaque build
  },
});
