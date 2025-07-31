import express from "express";
import axios from "axios";
import Order from "../models/Order.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🧾 Create a new order with Paystack payment verification
router.post("/", protect, async (req, res) => {
  const { items, address, phone, totalAmount, paymentRef } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "No items in order" });
  }

  if (!paymentRef) {
    return res.status(400).json({ error: "Missing payment reference" });
  }

  try {
    // 🔒 Verify payment with Paystack
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${paymentRef}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const paymentData = response.data?.data;

    if (response.data.status !== true || paymentData.status !== "success") {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    // ✅ Create the order
    const newOrder = await Order.create({
      user: req.user.id,
      items,
      address,
      phone,
      totalAmount,
      paymentRef,
      status: "Paid",
      paymentMethod: "Paystack",
    });

    res.status(201).json(newOrder);
  } catch (err) {
    console.error("Payment/order error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to verify payment or place order" });
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
