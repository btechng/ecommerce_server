import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { protect } from "../middleware/authMiddleware.js"; // ✅ Ensure you have this

const router = express.Router();

// ✅ Update user profile (must be logged in)
router.put("/:id", protect, async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to update this user" });
    }

    const { name, password } = req.body;
    const update = {};

    if (name) update.name = name;
    if (password) update.password = await bcrypt.hash(password, 10);

    const updatedUser = await User.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });

    res.json(updatedUser);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Profile update failed", error: err.message });
  }
});

// ✅ Track recently viewed product (must be logged in)
router.post("/:id/view-product", protect, async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { productId } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    // Remove existing entry if duplicate
    user.recentlyViewed = user.recentlyViewed.filter(
      (id) => id.toString() !== productId
    );

    // Add to beginning
    user.recentlyViewed.unshift(productId);

    // Keep only last 10
    if (user.recentlyViewed.length > 10) {
      user.recentlyViewed = user.recentlyViewed.slice(0, 10);
    }

    await user.save();
    res.sendStatus(200);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to track product", error: err.message });
  }
});

// ✅ Get recently viewed products (must be logged in)
router.get("/:id/recent-products", protect, async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const user = await User.findById(req.params.id).populate("recentlyViewed");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user.recentlyViewed);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch recent products", error: err.message });
  }
});

export default router;
