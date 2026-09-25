import multer from "multer";
import path from 'path'
import { storagePath } from "../../shared/paths.js";
import fileService from "../files/fileService.js";
const { checkFolder } = fileService();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
     let folder = storagePath("tmp", "my-uploads")
    checkFolder(folder)
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});

export const uploadFile = multer({ storage: storage });
