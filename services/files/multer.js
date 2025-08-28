import multer from "multer";
import path from 'path'
import { __dirname } from "../../index.js";
import fileService from "../files/fileService.js";
const { checkFolder } = fileService();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
     let folder = path.join(__dirname, "storage/tmp/my-uploads")
    checkFolder(folder)
    cb(null, "./storage/tmp/my-uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});

export const uploadFile = multer({ storage: storage });
