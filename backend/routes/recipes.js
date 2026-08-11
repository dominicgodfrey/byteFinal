import express from "express";
import {
  getRecipes,
  getPublicRecipes,
  getRecipeById,
  addRecipe,
  updateRecipe,
  deleteRecipe,
} from "../controllers/recipesController.js";
import { addCook, deleteCook } from "../controllers/cooksController.js";
import { auth, optionalAuth } from "../middleware/auth.js";
import {
  validateRecipeCreate,
  validateRecipeUpdate,
  validateCook,
} from "../middleware/validate.js";

const router = express.Router();

// Before "/:id", which would match "public".
router.get("/public", getPublicRecipes);

router.get("/", auth, getRecipes);
router.get("/:id", optionalAuth, getRecipeById);
router.post("/", auth, validateRecipeCreate, addRecipe);
router.patch("/:id", auth, validateRecipeUpdate, updateRecipe);
router.delete("/:id", auth, deleteRecipe);

// Cook log: photos of the recipe if made.
router.post("/:id/cooks", auth, validateCook, addCook);
router.delete("/:id/cooks/:cookId", auth, deleteCook);

export default router;
