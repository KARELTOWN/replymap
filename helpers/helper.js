export const getFileMetadata = (file) => {
  const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
  return {
    name: file.originalname,
    type: file.mimetype,
    size: sizeInMB,
  };
};
