import express from "express";
import { register, login, me } from "../controllers/usersController.js";
import { validateRegister, validateLogin } from "../middleware/validate.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.get("/me", auth, me);

export default router;
