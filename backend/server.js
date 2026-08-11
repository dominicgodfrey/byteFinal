import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import usersRouter from "./routes/users.js";
import recipesRouter from "./routes/recipes.js";
import convertRouter, { unitsRouter } from "./routes/convert.js";
import uploadsRouter from "./routes/uploads.js";

const app = express();
const PORT = process.env.PORT || 3000;

for (const key of ["MONGO_URI", "JWT_SECRET"]) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}. See .env.example`);
    process.exit(1);
  }
}

function logger(req, _res, next) {
  console.log(`${req.method} ${req.url}`);
  next();
}

// Browsers only. Native requests send no Origin header.
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  })
);

// Images use multer, so this cap suffices.
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// The app pings this to wake hosting.
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, db: mongoose.connection.readyState === 1 });
});

app.use("/api/users", usersRouter);
app.use("/api/recipes", recipesRouter);
app.use("/api/units", unitsRouter);
app.use("/api/convert", convertRouter);
app.use("/api/uploads", uploadsRouter);

app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.url}` });
});

// Catch-all, so thrown errors return JSON not HTML.
app.use((err, _req, res, _next) => {
  console.error("Unhandled:", err);

  if (err.message?.includes("not allowed by CORS")) {
    return res.status(403).json({ error: "Origin not allowed" });
  }

  res.status(500).json({ error: "Something went wrong on the server" });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Bytes API running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to connect to the database:", err.message);
    process.exit(1);
  });
