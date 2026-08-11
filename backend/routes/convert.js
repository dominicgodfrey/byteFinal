import express from "express";
import { getUnits, postConvert } from "../controllers/convertController.js";
import { validateConvert } from "../middleware/validate.js";

const router = express.Router();

router.post("/", validateConvert, postConvert);

export default router;

// Public and cacheable, mounted at /api/units.
export const unitsRouter = express.Router().get("/", getUnits);
