import express from "express";
import User from "../models/User.js"; // ✅ Add `.js` extension
import bcrypt from "bcryptjs";

const router = express.Router();

// ✅ Update user profile
router.put("/:id", async (req, res) => {
  try {
    const { name, password } = req.body;
    const update = {};
    if (name) update.name = name;
    if (password) update.password = await bcrypt.hash(password, 10);

    const updatedUser = await User.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: "Profile update failed", error: err });
  }
});

// ✅ Log product as recently viewed
router.post("/:id/view-product", async (req, res) => {
  try {
    const { productId } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Prevent duplicates
    user.recentlyViewed = user.recentlyViewed.filter(
      (id) => id.toString() !== productId
    );

    user.recentlyViewed.unshift(productId);

    if (user.recentlyViewed.length > 10) {
      user.recentlyViewed = user.recentlyViewed.slice(0, 10);
    }

    await user.save();
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ message: "Failed to track product", error: err });
  }
});

// ✅ Get recently viewed products
router.get("/:id/recent-products", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("recentlyViewed");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user.recentlyViewed);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch recent products", error: err });
  }
});

export default router;
