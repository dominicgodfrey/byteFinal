import mongoose from "mongoose";
import { Recipe } from "../models/Recipe.js";
import cloudinary, { cloudinaryConfigured } from "../config/cloudinary.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/** GET /api/recipes. Supports ?q= and ?tag=. */
export async function getRecipes(req, res) {
  try {
    const filter = { author: req.userId };

    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (q) {
      // Escape metacharacters so odd searches cannot throw.
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.title = { $regex: safe, $options: "i" };
    }

    const tag = typeof req.query.tag === "string" ? req.query.tag.trim() : "";
    if (tag) filter.tags = tag;

    const recipes = await Recipe.find(filter).sort({ updatedAt: -1 });
    res.json(recipes);
  } catch (err) {
    console.error("getRecipes:", err);
    res.status(500).json({ error: "Server error while loading your recipes" });
  }
}

/** GET /api/recipes/public. Open feed, no auth. */
export async function getPublicRecipes(req, res) {
  try {
    const recipes = await Recipe.find({ isPublic: true })
      .sort({ updatedAt: -1 })
      .limit(50)
      .populate("author", "name");

    res.json(recipes);
  } catch (err) {
    console.error("getPublicRecipes:", err);
    res.status(500).json({ error: "Server error while loading recipes" });
  }
}

/** GET /api/recipes/:id. Owner always, others if public. */
export async function getRecipeById(req, res) {
  const { id } = req.params;
  if (!isValidId(id)) return res.status(404).json({ error: "Recipe not found" });

  try {
    const recipe = await Recipe.findById(id).populate("author", "name");
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });

    const ownerId = recipe.author?._id ?? recipe.author;
    const isOwner = req.userId && String(ownerId) === String(req.userId);

    if (!isOwner && !recipe.isPublic) {
      return res.status(403).json({ error: "That recipe is private" });
    }

    res.json(recipe);
  } catch (err) {
    console.error("getRecipeById:", err);
    res.status(500).json({ error: "Server error while loading the recipe" });
  }
}

/** POST /api/recipes. Quantities arrive normalized per serving. */
export async function addRecipe(req, res) {
  try {
    const recipe = await Recipe.create({ ...req.clean, author: req.userId });
    res.status(201).json(recipe);
  } catch (err) {
    console.error("addRecipe:", err);
    res.status(500).json({ error: "Server error while saving the recipe" });
  }
}

/** PATCH /api/recipes/:id. Owner only. */
export async function updateRecipe(req, res) {
  const { id } = req.params;
  if (!isValidId(id)) return res.status(404).json({ error: "Recipe not found" });

  try {
    const recipe = await Recipe.findById(id);
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });

    if (String(recipe.author) !== String(req.userId)) {
      return res.status(403).json({ error: "That isn't your recipe" });
    }

    // Allowlisted, so author and cooks stay safe.
    Object.assign(recipe, req.clean);
    await recipe.save();

    res.json(recipe);
  } catch (err) {
    console.error("updateRecipe:", err);
    res.status(500).json({ error: "Server error while updating the recipe" });
  }
}

/** DELETE /api/recipes/:id. Owner only, also removes photos. */
export async function deleteRecipe(req, res) {
  const { id } = req.params;
  if (!isValidId(id)) return res.status(404).json({ error: "Recipe not found" });

  try {
    const recipe = await Recipe.findById(id);
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });

    if (String(recipe.author) !== String(req.userId)) {
      return res.status(403).json({ error: "That isn't your recipe" });
    }

    // Images first, or their public IDs are lost.
    if (cloudinaryConfigured) {
      const ids = recipe.cooks.map((c) => c.photoPublicId).filter(Boolean);

      await Promise.all(
        ids.map((publicId) =>
          cloudinary.uploader
            .destroy(publicId)
            .catch((e) => console.error("cloudinary destroy failed:", publicId, e.message))
        )
      );
    }

    await recipe.deleteOne();
    res.json({ message: "Recipe deleted", _id: id });
  } catch (err) {
    console.error("deleteRecipe:", err);
    res.status(500).json({ error: "Server error while deleting the recipe" });
  }
}
