import express from "express";
import { uploadImage } from "../controllers/uploadsController.js";
import { auth } from "../middleware/auth.js";
import { uploadMiddleware } from "../middleware/parseUpload.js";

const router = express.Router();

router.post("/", auth, uploadMiddleware, uploadImage);

export default router;
