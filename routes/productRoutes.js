import express from "express";
import Product from "../models/Product.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Get all products
router.get("/", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// ✅ Get products by category
router.get("/category/:category", async (req, res) => {
  const category = req.params.category;
  try {
    const products = await Product.find({
      category: { $regex: new RegExp(category, "i") }, // case-insensitive match
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch category products" });
  }
});

// ✅ Add a new product
router.post("/", protect, isAdmin, async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Update an existing product by ID
router.put("/:id", protect, isAdmin, async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ error: "Product not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete a product by ID
router.delete("/:id", protect, isAdmin, async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get all distinct categories
router.get("/categories/list", async (req, res) => {
  try {
    const categories = await Product.distinct("category");
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

export default router;
