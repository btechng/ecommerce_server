import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Get user profile by id (must be logged in)
router.get("/:id", protect, async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const user = await User.findById(req.params.id).select("-password -__v");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch user", error: err.message });
  }
});

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

    // Remove duplicate if exists
    user.recentlyViewed = user.recentlyViewed.filter(
      (id) => id.toString() !== productId
    );

    // Add new product to top
    user.recentlyViewed.unshift(productId);

    // Limit to 10 items
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

// ✅ Get transaction history (new route)
router.get("/:id/transactions", protect, async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const user = await User.findById(req.params.id).select("transactions");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user.transactions.reverse()); // latest first
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch transactions", error: err.message });
  }
});

export default router;
