import _ from "lodash";
import User from "../models/User.js";

function shuffleString(str) {
  const arr = str.split("");
  return _.shuffle(arr).join("");
}

const generateUsername = (data) => {
  return new Promise(async (resolve, reject) => {
    if (!data.firstname || !data.lastname) {
      reject("Nom et prénom non envoyé pour créer le nom d'utilisateur");
    }
    let user = null;
    let result = "@";
    do {
      let initial =
        data.lastname.replace(/\s+/g, "") +
        "" +
        data.firstname.replace(/\s+/g, "") +
        "0123456789";
      let shuffle = shuffleString(initial);
      for (let i = 0; i < 8; i++) {
        result += shuffle.charAt(Math.floor(Math.random() * shuffle.length));
      }
      user = await User.findOne({ username: result }).exec();
    } while (user);
    resolve(result);
  });
};
export default generateUsername;
