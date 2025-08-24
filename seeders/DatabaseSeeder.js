// import ContractTypeSeeder from "./ContractTypeSeeder.jS";
// import FeatureSeeder from "./FeatureSeeder.js";
// import FilesTypeSeeder from "./FilesTypeSeeder.js";
// import FonctionSeeder from "./FonctionSeeder.js";
// import ModuleSeeder from "./ModuleSeeder.js";
// import PermissionSeeder from "./PermissionSeeder.js";
// import PostSeeder from "./PostSeeder.js";
// import EventTypeSeeder from "./EventTypeSeeder.js";
// import FeedbackPrioritySeeder from "./FeedbackPrioritySeeder.js";
import FeedbackStatusSeeder from "./FeedbackStatusSeeder.js";
// import FeedbackTypeSeeder from "./FeedbackTypeSeeder.js";
// import ListIntegrationSeeder from "./ListIntegrationSeeder.js";
// import RoleSeeder from "./RoleSeeder.js";

try {
  // FilesTypeSeeder();
  // PostSeeder();
  // RoleSeeder();
  // EventTypeSeeder()
  // FeedbackPrioritySeeder();
  // FeedbackTypeSeeder();
  ListIntegrationSeeder();
  // FeedbackStatusSeeder();
  // ContractTypeSeeder();
  // await FonctionSeeder();
  // await ModuleSeeder();
  // await FeatureSeeder();
  // await PermissionSeeder();
} catch (error) {
  console.log("Erreur d'exécution des seeders");
  throw error;
}
