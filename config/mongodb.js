import mongoose from "mongoose";
import { configDotenv } from "dotenv";
configDotenv();
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER_URL}/${process.env.DB_CLUSTER}?retryWrites=true`;
const clientOptions = {
  serverApi: { version: "1", strict: true, deprecationErrors: true },
};

async function connectDB() {
  const maxRetries = 5; // Nombre maximum de tentatives
  let retryCount = 0; // Compteur de tentatives
  let retryDelayMs = 3000;
  while (retryCount < maxRetries) {
    try {
      const connect = await mongoose.connect(uri, clientOptions);
      await mongoose.connection.db.admin().command({ ping: 1 });
      console.log("Connexion réussie à MongoDB!");
      return;
    } catch (error) {
      retryCount++;
      console.error(
        `Erreur de connexion à MongoDB (Tentative ${retryCount}/${maxRetries}):`,
        error.message
      );
      if (retryCount < maxRetries) {
        console.log(
          `Nouvelle tentative dans ${retryDelayMs / 1000} secondes...`
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs)); // VRAI DÉLAI
      }
    }
  }

  const finalError = new Error(
    "Nombre maximum de tentatives de connexion à MongoDB atteint. Impossible de se connecter."
  );
  console.error(finalError.message);
  throw finalError; // Lance une erreur pour que le processus de démarrage puisse la gérer
}

await connectDB().catch((error) => {
  console.error(
    "Échec critique de la connexion à la base de données au démarrage:",
    error
  );
  // Crucial: Exit the process if the database connection fails after all retries.
  // This prevents your application from running in a broken state.
  process.exit(1);
});
export default mongoose;
