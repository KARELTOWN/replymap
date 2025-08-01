import _ from "lodash";

const generateStrongPassword = (length = 8) => {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const specials = "!#$%&()*+,-./:;=?@[]^_`{|}~";
  const numbers = "0123456789";

  if (length < 8) {
    console.error(
      "La longueur minimale du mot de passe doit être de 8 caractères."
    );
  }

  // Sélectionne au moins un caractère de chaque catégorie
  const randomChar = (chars) => {
    return chars.charAt(Math.floor(Math.random() * chars.length));
  };
  const passwordArray = [
    randomChar(letters.toUpperCase()), // Une majuscule
    randomChar(letters.toLowerCase()), // Une minuscule
    randomChar(numbers), // Un chiffre
    randomChar(specials), // Un symbole
  ];

  // Complète avec des caractères aléatoires pour atteindre la longueur requise
  const allChars = letters + numbers + specials;
  while (passwordArray.length < length) {
    passwordArray.push(randomChar(allChars));
  }


  // Mélange aléatoirement les caractères pour éviter un motif prévisible
  return _.shuffle(passwordArray).join("");
};
export default generateStrongPassword;
