import Module from "../models/Module.js";

const FeatureSeeder = async () => {
  try {
    const modules = [
      "Utilisateurs",
      "Offres d'Emploi",
      "Soumissions",
      "Recruteurs",
      "Demandeurs",
      "Nofications",
      "Profils",
    ];
    for (const moduleLibelle of modules) {
      const foundModule = await Module.findOne({ libelle: moduleLibelle });
      if (foundModule) {
        let features = [];
        if (module == "Utilisateurs") {
          features = [
            {
              libelle: "Afficher la liste",
              module_id: foundModule._id,
            },
            {
              libelle: "Ajouter un compte administrateur",
              module_id: foundModule._id,
            },
            {
              libelle: "Ajouter un compte utilisateur",
              module_id: foundModule._id,
            },
            {
              libelle: "Modifier un compte administrateur",
              module_id: foundModule._id,
            },
            {
              libelle: "Modifier un compte utilisateur",
              module_id: foundModule._id,
            },
            {
              libelle: "Activer-Désactiver un compte administrateur",
              module_id: foundModule._id,
            },
            {
              libelle: "Activer-Désactiver un compte utilisateur",
              module_id: foundModule._id,
            },
            {
              libelle: "Générer un nouveau mot de passe à un administrateur",
              module_id: foundModule._id,
            },
            {
              libelle: "Générer un nouveau mot de passe à un utilisateur",
              module_id: foundModule._id,
            },
          ];
        }
        if (module == "Offres d'Emploi") {
          features = [
            {
              libelle: "Afficher la liste",
              module_id: foundModule._id,
            },
            {
              libelle: "Ajouter",
              module_id: foundModule._id,
            },
            {
              libelle: "Modifier",
              module_id: foundModule._id,
            },
            {
              libelle: "Cloturer",
              module_id: foundModule._id,
            },
            {
              libelle: "Voir liste soumission par offre",
              module_id: foundModule._id,
            },
          ];
        }
        if (module == "Demandeurs") {
          features = [
            {
              libelle: "Afficher la liste",
              module_id: foundModule._id,
            },
            {
              libelle: "Voir",
              module_id: foundModule._id,
            },
            {
              libelle: "Ouvrir fichier",
              module_id: foundModule._id,
            },
            {
              libelle: "Télécharger fichier",
              module_id: foundModule._id,
            },
          ];
        }
        if (module == "Recruteurs") {
          features = [
            {
              libelle: "Afficher la liste",
              module_id: foundModule._id,
            },
            {
              libelle: "Voir",
              module_id: foundModule._id,
            },
            {
              libelle: "Ouvrir fichier",
              module_id: foundModule._id,
            },
            {
              libelle: "Télécharger fichier",
              module_id: foundModule._id,
            },
          ];
        }
        if (module == "Soumissions") {
          features = [
            {
              libelle: "Afficher la liste",
              module_id: foundModule._id,
            },
            {
              libelle: "Changer le status de la soumission",
              module_id: foundModule._id,
            },
            {
              libelle: "Voir",
              module_id: foundModule._id,
            },
            {
              libelle: "Ouvrir fichier",
              module_id: foundModule._id,
            },
            {
              libelle: "Télécharger fichier",
              module_id: foundModule._id,
            },
          ];
        }

        if (module == "Notifications") {
          features = [
            {
              libelle: "Afficher la liste",
              module_id: foundModule._id,
            },
            {
              libelle: "Voir",
              module_id: foundModule._id,
            },
          ];
        }

        if (module == "Profils") {
          features = [
            {
              libelle: "Modifier un profil de recruteur",
              module_id: foundModule._id,
            },
            {
              libelle: "Modifier un profil de demandeur",
              module_id: foundModule._id,
            },
          ];
        }

        await Module.insertMany(features);
      } else {
        console.warn(
          `Module "${moduleLibelle}" not found in database. Skipping feature seeding for this module.`
        );
        continue;
      }
    }
    console.log("All module features processed.");
  } catch (error) {
    throw error;
  }
};
export default FeatureSeeder;
