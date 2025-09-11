// import FeatureSeeder from "./FeatureSeeder.js";
// import FonctionSeeder from "./FonctionSeeder.js";
// import ModuleSeeder from "./ModuleSeeder.js";
// import PermissionSeeder from "./PermissionSeeder.js";
import EventTypeSeeder from "./EventTypeSeeder.js";
import FeedbackPrioritySeeder from "./FeedbackPrioritySeeder.js";
import FeedbackStatusSeeder from "./FeedbackStatusSeeder.js";
import FeedbackTypeSeeder from "./FeedbackTypeSeeder.js";
import ListIntegrationSeeder from "./ListIntegrationSeeder.js";
import NotificationModelSeeder from "./NotificationModelSeeder.js";
import RoleSeeder from "./RoleSeeder.js";

try {
  await RoleSeeder();
  await EventTypeSeeder();
  await FeedbackPrioritySeeder();
  await FeedbackTypeSeeder();
  await ListIntegrationSeeder();
  await FeedbackStatusSeeder();
  await NotificationModelSeeder();
  // await FonctionSeeder();
  // await ModuleSeeder();
  // await FeatureSeeder();
  // await PermissionSeeder();
  process.exit(0);
} catch (error) {
  console.log("Erreur d'exécution des seeders");
  throw error;
}
