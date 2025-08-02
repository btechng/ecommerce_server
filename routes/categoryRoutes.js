import express from "express";
import Category from "../models/Category.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// ➕ Add a new category (admin only)
router.post("/", protect, isAdmin, async (req, res) => {
  const { name } = req.body;

  try {
    const exists = await Category.findOne({ name });
    if (exists)
      return res.status(400).json({ error: "Category already exists" });

    const newCategory = await Category.create({ name });
    res.status(201).json(newCategory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📋 Get all categories
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

export default router;
