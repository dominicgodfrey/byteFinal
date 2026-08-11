// Seeds a demo account. Quantities are per serving.
//
//   npm run seed

import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { Recipe } from "../models/Recipe.js";

const DEMO_EMAIL = "demo@bytes.app";
const DEMO_PASSWORD = "demopass123";

const recipes = [
  {
    title: "Weeknight Garlic Pasta",
    description: "The one you make when the fridge is empty. Ready in the time the water boils.",
    enteredForServings: 4,
    isPublic: true,
    tags: ["pasta", "quick", "vegetarian"],
    ingredients: [
      { name: "spaghetti", quantity: 100, unit: "g" },
      { name: "garlic", quantity: 2, unit: "clove" },
      { name: "olive oil", quantity: 1, unit: "tbsp" },
      { name: "chili flakes", quantity: 0.25, unit: "tsp" },
      { name: "parmesan", quantity: 15, unit: "g" },
      { name: "parsley", quantity: 1, unit: "tbsp" },
    ],
    steps: [
      "Boil the pasta in well-salted water until just shy of al dente.",
      "Meanwhile, warm the olive oil and sliced garlic over low heat until barely golden.",
      "Add the chili flakes and a ladle of pasta water; let it bubble into a sauce.",
      "Drain the pasta and toss it in the pan for a minute so it finishes in the sauce.",
      "Off the heat, stir through the parmesan and parsley.",
    ],
  },
  {
    title: "Overnight Oats",
    description: "Assembled in two minutes the night before. Scales cleanly for a whole week.",
    enteredForServings: 1,
    isPublic: true,
    tags: ["breakfast", "no-cook", "meal-prep"],
    ingredients: [
      { name: "rolled oats", quantity: 0.5, unit: "cup" },
      { name: "milk", quantity: 0.5, unit: "cup" },
      { name: "greek yogurt", quantity: 2, unit: "tbsp" },
      { name: "maple syrup", quantity: 1, unit: "tsp" },
      { name: "chia seeds", quantity: 1, unit: "tsp" },
      { name: "salt", quantity: 1, unit: "pinch" },
    ],
    steps: [
      "Stir everything together in a jar.",
      "Seal and refrigerate at least 4 hours, ideally overnight.",
      "Top with fruit before eating.",
    ],
  },
  {
    title: "Sheet Pan Chicken Thighs",
    description: "One pan, no technique required. The potatoes cook in the chicken fat.",
    enteredForServings: 2,
    isPublic: false,
    tags: ["dinner", "one-pan"],
    ingredients: [
      { name: "chicken thighs", quantity: 2, unit: "piece" },
      { name: "baby potatoes", quantity: 200, unit: "g" },
      { name: "olive oil", quantity: 1, unit: "tbsp" },
      { name: "smoked paprika", quantity: 0.5, unit: "tsp" },
      { name: "lemon", quantity: 0.5, unit: "piece" },
    ],
    steps: [
      "Heat the oven to 220°C / 425°F.",
      "Halve the potatoes and toss with oil, paprika, salt and pepper.",
      "Nestle the chicken thighs skin-side up among the potatoes.",
      "Roast 35–40 minutes until the skin is crisp and the potatoes are tender.",
      "Squeeze the lemon over everything before serving.",
    ],
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.");

  let user = await User.findOne({ email: DEMO_EMAIL });

  if (!user) {
    user = await User.create({
      name: "Demo Cook",
      email: DEMO_EMAIL,
      passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10),
    });
    console.log(`Created demo user ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  } else {
    console.log("Demo user already exists.");
  }

  // Replace, so re-running never piles up duplicates.
  await Recipe.deleteMany({ author: user._id });
  await Recipe.insertMany(recipes.map((r) => ({ ...r, author: user._id })));

  console.log(`Seeded ${recipes.length} recipes.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
