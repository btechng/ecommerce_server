import express from "express";
import Product from "../models/Product.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";
import slugify from "slugify";

const router = express.Router();

// 🛒 GET: All products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// 🛍 GET: Products by category slug
router.get("/category/:slug", async (req, res) => {
  try {
    const products = await Product.find({
      categorySlug: req.params.slug.toLowerCase(),
    });
    res.json(products);
  } catch {
    res.status(500).json({ error: "Failed to fetch category products" });
  }
});

// ➕ POST: Create product or job listing
router.post("/", protect, async (req, res) => {
  const { category } = req.body;

  try {
    const categorySlug = slugify(category, { lower: true, strict: true });

    // Allow regular users to post jobs
    const isJob =
      categorySlug === "jobvacancy" || category.toLowerCase() === "job/vacancy";
    if (!isJob && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can add products" });
    }

    const newProduct = new Product({ ...req.body, categorySlug });
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✏️ PUT: Update product
router.put("/:id", protect, isAdmin, async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.body.category) {
      updateData.categorySlug = slugify(req.body.category, {
        lower: true,
        strict: true,
      });
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!updated) return res.status(404).json({ error: "Product not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ❌ DELETE: Remove product
router.delete("/:id", protect, isAdmin, async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Product not found" });
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🗂 GET: All distinct categories
router.get("/categories/list", async (req, res) => {
  try {
    const categories = await Product.distinct("category");
    res.json(categories);
  } catch {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// 🔍 GET: Single product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// 🌟 POST: Add product review
router.post("/:id/reviews", protect, async (req, res) => {
  const { comment, rating } = req.body;

  if (!comment || !rating) {
    return res.status(400).json({ error: "Comment and rating are required" });
  }

  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const alreadyReviewed = product.reviews.find(
      (r) => r.userId?.toString() === req.user._id.toString()
    );
    if (alreadyReviewed) {
      return res
        .status(400)
        .json({ error: "You already reviewed this product" });
    }

    const review = {
      userId: req.user._id,
      user: req.user.name || "Anonymous",
      rating: Number(rating),
      comment,
      date: new Date(),
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, r) => acc + r.rating, 0) /
      product.numReviews;

    await product.save();
    res.status(201).json({ message: "Review submitted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
