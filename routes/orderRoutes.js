import express from "express";
import Order from "../models/Order.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🧾 Create a new order
router.post("/", protect, async (req, res) => {
  const { items, address, phone, totalAmount } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "No items in order" });
  }

  try {
    const newOrder = await Order.create({
      user: req.user.id,
      items,
      address,
      phone,
      totalAmount,
    });

    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ error: "Failed to place order" });
  }
});

// 📦 Get logged-in user's orders
router.get("/my", protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate("items.product");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// 📋 Admin: Get all orders
router.get("/", protect, isAdmin, async (req, res) => {
  try {
    const allOrders = await Order.find()
      .populate("user", "name email")
      .populate("items.product");
    res.json(allOrders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch all orders" });
  }
});

// ✅ Admin: Update order status
router.put("/:id", protect, isAdmin, async (req, res) => {
  const { status } = req.body;

  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.status = status;
    await order.save();

    res.json({ message: "Order status updated", order });
  } catch (err) {
    res.status(500).json({ error: "Failed to update order" });
  }
});

export default router;
