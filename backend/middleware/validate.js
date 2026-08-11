import { isUnit } from "../lib/units.js";

// Sanitization is an allowlist: only known fields survive.

const str = (v) => (typeof v === "string" ? v.trim() : "");

/** Field-level errors, so forms can place them. */
class Errors {
  constructor() {
    this.fields = {};
  }
  add(field, message) {
    if (!this.fields[field]) this.fields[field] = message;
  }
  get any() {
    return Object.keys(this.fields).length > 0;
  }
}

export function validateRegister(req, res, next) {
  const e = new Errors();
  const name = str(req.body?.name);
  const email = str(req.body?.email).toLowerCase();
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (name.length < 2 || name.length > 60) e.add("name", "Name must be 2–60 characters");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.add("email", "Enter a valid email address");
  if (password.length < 8) e.add("password", "Password must be at least 8 characters");

  if (e.any) return res.status(400).json({ error: "Validation failed", fields: e.fields });

  req.clean = { name, email, password };
  next();
}

export function validateLogin(req, res, next) {
  const e = new Errors();
  const email = str(req.body?.email).toLowerCase();
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!email) e.add("email", "Email is required");
  if (!password) e.add("password", "Password is required");

  if (e.any) return res.status(400).json({ error: "Validation failed", fields: e.fields });

  req.clean = { email, password };
  next();
}

/** Partial mode checks only the sent fields. */
function recipeValidator(partial) {
  return function (req, res, next) {
    const e = new Errors();
    const body = req.body ?? {};
    const clean = {};

    const has = (k) => body[k] !== undefined;

    if (!partial || has("title")) {
      const title = str(body.title);
      if (title.length < 2 || title.length > 80) e.add("title", "Title must be 2–80 characters");
      clean.title = title;
    }

    if (has("description")) {
      const description = str(body.description);
      if (description.length > 500) e.add("description", "Description must be under 500 characters");
      clean.description = description;
    }

    if (!partial || has("ingredients")) {
      const list = body.ingredients;

      if (!Array.isArray(list) || list.length === 0) {
        e.add("ingredients", "Add at least one ingredient");
      } else if (list.length > 60) {
        e.add("ingredients", "That's more than 60 ingredients — split the recipe up");
      } else {
        const parsed = [];

        for (let i = 0; i < list.length; i++) {
          const row = list[i] ?? {};
          const name = str(row.name);
          const quantity = Number(row.quantity);
          const unit = str(row.unit);

          if (!name) {
            e.add(`ingredients.${i}.name`, "Ingredient name is required");
          } else if (!Number.isFinite(quantity) || quantity <= 0) {
            e.add(`ingredients.${i}.quantity`, "Quantity must be a number greater than 0");
          } else if (!isUnit(unit)) {
            e.add(`ingredients.${i}.unit`, `"${unit}" is not a unit we know`);
          } else {
            parsed.push({ name, quantity, unit });
          }
        }

        if (!e.any) clean.ingredients = parsed;
      }
    }

    if (has("steps")) {
      if (!Array.isArray(body.steps)) {
        e.add("steps", "Steps must be a list");
      } else {
        clean.steps = body.steps.map(str).filter(Boolean).slice(0, 50);
      }
    }

    if (has("enteredForServings")) {
      const n = Number(body.enteredForServings);
      if (!Number.isFinite(n) || n < 1) e.add("enteredForServings", "Must be 1 or more");
      else clean.enteredForServings = n;
    }

    if (has("tags")) {
      if (!Array.isArray(body.tags)) e.add("tags", "Tags must be a list");
      else clean.tags = body.tags.map(str).filter(Boolean).slice(0, 10);
    }

    if (has("isPublic")) clean.isPublic = Boolean(body.isPublic);

    if (e.any) return res.status(400).json({ error: "Validation failed", fields: e.fields });

    if (partial && Object.keys(clean).length === 0) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    req.clean = clean;
    next();
  };
}

export const validateRecipeCreate = recipeValidator(false);
export const validateRecipeUpdate = recipeValidator(true);

export function validateCook(req, res, next) {
  const e = new Errors();
  const photoUrl = str(req.body?.photoUrl);
  const servings = req.body?.servings === undefined ? 1 : Number(req.body.servings);
  const notes = str(req.body?.notes);

  if (!/^https?:\/\//.test(photoUrl)) e.add("photoUrl", "A photo is required");
  if (!Number.isFinite(servings) || servings < 1) e.add("servings", "Servings must be 1 or more");
  if (notes.length > 300) e.add("notes", "Notes must be under 300 characters");

  if (e.any) return res.status(400).json({ error: "Validation failed", fields: e.fields });

  req.clean = {
    photoUrl,
    photoPublicId: str(req.body?.photoPublicId),
    servings,
    notes,
  };
  next();
}

export function validateConvert(req, res, next) {
  const e = new Errors();
  const quantity = Number(req.body?.quantity);
  const from = str(req.body?.from);
  const to = str(req.body?.to);

  if (!Number.isFinite(quantity) || quantity < 0) e.add("quantity", "Enter a number of 0 or more");
  if (!isUnit(from)) e.add("from", "Unknown unit");
  if (!isUnit(to)) e.add("to", "Unknown unit");

  if (e.any) return res.status(400).json({ error: "Validation failed", fields: e.fields });

  req.clean = { quantity, from, to };
  next();
}
