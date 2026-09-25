// import FeatureSeeder from "./FeatureSeeder.js";
// import FonctionSeeder from "./FonctionSeeder.js";
// import ModuleSeeder from "./ModuleSeeder.js";
// import PermissionSeeder from "./PermissionSeeder.js";
import EventTypeSeeder from "./EventTypeSeeder.js";
import FeedbackStatusSeeder from "./FeedbackStatusSeeder.js";
import FeedbackTypeSeeder from "./FeedbackTypeSeeder.js";
import ListIntegrationSeeder from "./ListIntegrationSeeder.js";
import NotificationModelSeeder from "./NotificationModelSeeder.js";
import RoleSeeder from "./RoleSeeder.js";

const seeders = [
  RoleSeeder,
  EventTypeSeeder,
  FeedbackTypeSeeder,
  ListIntegrationSeeder,
  FeedbackStatusSeeder,
  NotificationModelSeeder,
  // FonctionSeeder();
  // ModuleSeeder();
  // FeatureSeeder();
  // PermissionSeeder();
];

for (const seeder of seeders) {
  try {
    await seeder();
    console.log(`${seeder.name} exécuté avec succès`);
  } catch (err) {
    console.error(`Erreur dans ${seeder.name}:`, err.message);
    // Carry on with the remaining seeders anyway
  }
}

console.log("Tous les seeders ont été exécutés (avec ou sans erreurs)");
process.exit(0);
