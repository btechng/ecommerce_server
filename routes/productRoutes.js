import express from "express";
import Product from "../models/Product.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";
import slugify from "slugify";

const router = express.Router();

// ✅ PUBLIC: GET Approved products (no login required)
router.get("/", async (req, res) => {
  try {
    const products = await Product.find({ isApproved: true });
    res.json(products);
  } catch {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// ✅ ADMIN: Get all products with ?all=true
router.get("/admin", protect, isAdmin, async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch {
    res.status(500).json({ error: "Failed to fetch all products" });
  }
});

// 🛍 GET: Products by category (only approved)
router.get("/category/:slug", async (req, res) => {
  try {
    const products = await Product.find({
      categorySlug: req.params.slug.toLowerCase(),
      isApproved: true,
    });
    res.json(products);
  } catch {
    res.status(500).json({ error: "Failed to fetch category products" });
  }
});

// ✅ POST: Authenticated user posts product
router.post("/post", protect, async (req, res) => {
  try {
    const category = req.body.category || "";
    const categorySlug = slugify(category, { lower: true, strict: true });

    const autoApprove = category.toLowerCase() === "job/vacancy";

    const newProduct = new Product({
      ...req.body,
      categorySlug,
      isApproved: autoApprove,
      approvalDate: autoApprove ? new Date() : undefined,
      postedBy: req.user._id,
    });

    await newProduct.save();

    res.status(201).json({
      message: autoApprove
        ? "Job/Vacancy posted successfully!"
        : "Product submitted for admin approval",
      newProduct,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✏️ PUT: Admin approves product
router.put("/approve/:id", protect, isAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    product.isApproved = true;
    product.approvalDate = new Date();
    await product.save();

    res.json({ message: "Product approved", product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✏️ PUT: Admin edits product
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

// ❌ DELETE: Admin deletes product
router.delete("/:id", protect, isAdmin, async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Product not found" });
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📦 GET: Single product by ID (only approved)
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.isApproved) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// 🌟 POST: Review product
router.post("/:id/reviews", protect, async (req, res) => {
  const { comment, rating } = req.body;

  if (!comment || !rating) {
    return res.status(400).json({ error: "Comment and rating are required" });
  }

  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.isApproved) {
      return res
        .status(404)
        .json({ error: "Product not found or not approved" });
    }

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

// 📁 GET: Distinct approved categories
router.get("/categories/list", async (req, res) => {
  try {
    const categories = await Product.find({ isApproved: true }).distinct(
      "category"
    );
    res.json(categories);
  } catch {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

export default router;
