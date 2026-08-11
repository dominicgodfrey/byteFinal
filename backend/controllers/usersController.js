import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "30d" });
}

function publicUser(user) {
  return { _id: user._id, name: user.name, email: user.email };
}

export async function register(req, res) {
  const { name, email, password } = req.clean;

  try {
    if (await User.exists({ email })) {
      return res.status(409).json({
        error: "That email is already registered",
        fields: { email: "That email is already registered" },
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });

    res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
  } catch (err) {
    console.error("register:", err);
    res.status(500).json({ error: "Server error while creating your account" });
  }
}

export async function login(req, res) {
  const { email, password } = req.clean;

  try {
    // select:false on the schema, so request it explicitly.
    const user = await User.findOne({ email }).select("+passwordHash");

    // Same message either way, so accounts stay unenumerable.
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Incorrect email or password" });
    }

    res.json({ token: signToken(user._id), user: publicUser(user) });
  } catch (err) {
    console.error("login:", err);
    res.status(500).json({ error: "Server error while logging in" });
  }
}

export async function me(req, res) {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(publicUser(user));
  } catch (err) {
    console.error("me:", err);
    res.status(500).json({ error: "Server error" });
  }
}
