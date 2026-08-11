import mongoose from "mongoose";
import { UNIT_KEYS } from "../lib/units.js";

// quantity is always the amount for one serving.
const ingredientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, enum: UNIT_KEYS },
  },
  { _id: false }
);

// Embedded, since cooks load with their recipe.
const cookSchema = new mongoose.Schema({
  photoUrl: { type: String, required: true },
  photoPublicId: String,
  servings: { type: Number, default: 1, min: 1 },
  notes: { type: String, trim: true, maxlength: 300 },
  cookedAt: { type: Date, default: Date.now },
});

const recipeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 500, default: "" },

    ingredients: {
      type: [ingredientSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "A recipe needs at least one ingredient",
      },
    },

    steps: { type: [String], default: [] },

    // Display only. Restores original amounts when editing.
    enteredForServings: { type: Number, default: 1, min: 1 },

    cooks: { type: [cookSchema], default: [] },

    tags: { type: [String], default: [] },
    isPublic: { type: Boolean, default: false },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Backs the library search box.
recipeSchema.index({ title: "text", tags: "text" });

export const Recipe = mongoose.model("Recipe", recipeSchema);
