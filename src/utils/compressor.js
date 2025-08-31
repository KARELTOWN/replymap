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
  let dataUrl = null;
  if (typeof data === "object") {

    dataUrl = await blobToDataURL(data);
  } else if (typeof data === "string") {

    dataUrl = data;
  }

  const encoded = new TextEncoder().encode(dataUrl);
  return deflate(encoded, { raw: true });
};
