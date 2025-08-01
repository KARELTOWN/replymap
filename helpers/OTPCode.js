export const generateOTP = () => {
  const randomChar = (chars) => {
    return chars.charAt(Math.floor(Math.random() * chars.length));
  };
  let codeOTP = "";
  const chiffres = "0123456789";
  for (var i = 0; i < 5; i++) {
    codeOTP += randomChar(chiffres);
  }
  return codeOTP;
};
