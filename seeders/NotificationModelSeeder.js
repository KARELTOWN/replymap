import NotificationModel from "../models/NotificationModel.js";

async function NotificationModelSeeder() {
  try {
    const notifications = [
      {
        name: "code de vérification de compte",
        title: "Mr/Mrs #firstname #lastname !",
        unique: "CVC",
        content:
          "Votre code de vérification : <strong>#code</strong> <br> Durée d'expiration : 1 heure",
      },
      {
        name: "création de compte",
        title: "Bienvenue #firstname #lastname !",
        unique: "CC",
        content:
          "Votre compte <strong>#firstname #lastname</strong> a été créé avec succès.<br>Vous pouvez maintenant accéder à tous nos services.",
      },

      {
        name: "Réinitialisation de mot de passe",
        title: "Mot de passe réinitialisé pour #firstname #lastname",
        unique: "RMP",
        content:
          "Bonjour <strong>#firstname #lastname</strong>,<br>Votre mot de passe a été réinitialisé",
      },
      {
        name: "lien de réinitialisation de mot de passe",
        title: "Réinitialisation du mot de passe pour #firstname #lastname",
        unique: "LRMP",
        content:
          "Bonjour <strong>#firstname #lastname</strong>,<br>Cliquez sur le lien suivant pour réinitialiser votre mot de passe : <a href='#link'>#link</a>. <br> <strong>Durée d'expiration du lien : </strong> 3 heures <br><br> Si vous n'avez pas demandé cette requête de réinitialisation, cliquez sur le lien ci-après <br>  <a href='#reject'>#reject</a>",
      },
      {
        name: "création d'un projet",
        title: "Nouveau projet créé : #libelle",
        unique: "CP",
        content:
          "Le projet <strong>#libelle</strong> a été créé avec succès.<br>Vous pouvez maintenant y ajouter des membres, des feedbacks et enregistrer des sessions.",
      },
      {
        name: "ajout d'un utilisateur à un projet",
        title: "#firstname #lastname ajouté au projet #libelle",
        unique: "AUP",
        content:
          "L’utilisateur <strong>#firstname #lastname</strong> a été ajouté au projet <strong>#libelle</strong>.<br>Il peut désormais collaborer avec l’équipe.",
      },
      {
        name: "ajout à un projet",
        title: "#firstname #lastname vous êtes ajouté au projet #libelle",
        unique: "AUP-I",
        content:
          "<strong>#firstname #lastname</strong> vous êtes ajouté au projet <strong>#libelle</strong>.<br>Vous pouvez désormais collaborer avec l’équipe.",
      },
      {
        name: "ajout feedback",
        title: "Nouveau feedback : #title (#priority)",
        unique: "AF",
        content:
          "<strong>Type :</strong> #type<br><strong>Projet :</strong> #project<br><strong>Titre :</strong> #title<br><strong>Description :</strong> #description<br><strong>Statut :</strong> #status<br><strong>",
      },
      {
        name: "modification feedback",
        title: "Mise à jour du feedback : #title",
        unique: "MF",
        content:
          "<div>#type</div> <br> <div>#status</div> <div>#priority</div> <div>#assignTo</div>",
      },
      {
        name: "quitter le projet",
        title: "#firstname #lastname a quitté le projet #libelle",
        unique: "QP",
        content:
          "L’utilisateur <strong>#firstname #lastname</strong> ne fait plus partie du projet <strong>#libelle</strong>.",
      },

      {
        name: "quitter le projet",
        title: "Projet #libelle",
        unique: "QP-I",
        content:
          "<strong>#firstname #lastname</strong>, vous ne faites plus partie du projet <strong>#libelle</strong>",
      },
    ];

    let insert = await NotificationModel.insertMany(notifications, {
      ordered: false,
    });
    console.log("Listes des modèles de notifications insérées");
  } catch (error) {
    throw error;
  }
}
export default NotificationModelSeeder;
