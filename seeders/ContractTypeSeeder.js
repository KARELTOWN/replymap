import ContractType from "../models/ContractType.js";
async function ContractTypeSeeder() {
  try {
    await ContractType.insertMany([{ libelle: "Récurrent" }, {libelle: "Ponctuel"}]);
    console.log("Types de contrats insérées");
  } catch (error) {
    throw error;
  }
}
export default ContractTypeSeeder;
