import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, enum: ["user", "admin"], default: "user" },
    recentlyViewed: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }], // ✅ New field
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
