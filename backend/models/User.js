import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // select: false keeps hashes out of query results.
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
