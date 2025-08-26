import Role from "../models/Role.js";

async function RoleSeeder() {
  try {
    const data = ["Utilisateur", "Administrateur"];
    let list = Array();
    data.forEach((element) => {
      list.push({ libelle: element });
    });
    await Role.insertMany(list, {ordered: false});
    console.log("Roles insérés");
  } catch (error) {
    throw error;
  }
}
export default RoleSeeder;
