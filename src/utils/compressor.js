import { deflate } from "pako";
const blobToDataURL = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result); // Data URL ici
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
export const compressData = async (data) => {
  console.log("data", typeof data);
  let dataUrl = null;
  console.log("avant", data);
  if (typeof data === "object") {
    console.log("object");

    dataUrl = await blobToDataURL(data);
  } else if (typeof data === "string") {
    console.log("string");

    dataUrl = data;
  }
  console.log("apres", dataUrl);

  const encoded = new TextEncoder().encode(dataUrl);
  return deflate(encoded, { raw: true });
};
