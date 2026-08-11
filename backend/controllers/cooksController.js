import mongoose from "mongoose";
import { Recipe } from "../models/Recipe.js";
import cloudinary, { cloudinaryConfigured } from "../config/cloudinary.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/** POST /api/recipes/:id/cooks. Photo plus servings cooked. */
export async function addCook(req, res) {
  const { id } = req.params;
  if (!isValidId(id)) return res.status(404).json({ error: "Recipe not found" });

  try {
    const recipe = await Recipe.findById(id);
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });

    if (String(recipe.author) !== String(req.userId)) {
      return res.status(403).json({ error: "That isn't your recipe" });
    }

    recipe.cooks.push(req.clean);
    await recipe.save();

    // Whole recipe back, so clients swap state.
    res.status(201).json(recipe);
  } catch (err) {
    console.error("addCook:", err);
    res.status(500).json({ error: "Server error while saving your cook photo" });
  }
}

/** DELETE /api/recipes/:id/cooks/:cookId */
export async function deleteCook(req, res) {
  const { id, cookId } = req.params;
  if (!isValidId(id) || !isValidId(cookId)) {
    return res.status(404).json({ error: "Not found" });
  }

  try {
    const recipe = await Recipe.findById(id);
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });

    if (String(recipe.author) !== String(req.userId)) {
      return res.status(403).json({ error: "That isn't your recipe" });
    }

    const cook = recipe.cooks.id(cookId);
    if (!cook) return res.status(404).json({ error: "Cook entry not found" });

    if (cloudinaryConfigured && cook.photoPublicId) {
      await cloudinary.uploader
        .destroy(cook.photoPublicId)
        .catch((e) => console.error("cloudinary destroy failed:", e.message));
    }

    cook.deleteOne();
    await recipe.save();

    res.json(recipe);
  } catch (err) {
    console.error("deleteCook:", err);
    res.status(500).json({ error: "Server error while deleting the photo" });
  }
}
