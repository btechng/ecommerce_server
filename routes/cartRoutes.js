import express from "express";
import axios from "axios";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Order from "../models/Order.js";

const router = express.Router();

// ✅ GET user's cart
router.get("/", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("cart.product");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user.cart);
  } catch (err) {
    console.error("Get cart error:", err.message);
    res.status(500).json({ error: "Failed to load cart" });
  }
});

// ✅ Add item to cart
router.post("/", protect, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const existing = user.cart.find(
      (item) => item.product.toString() === productId
    );
    if (existing) {
      existing.quantity += quantity;
    } else {
      user.cart.push({ product: productId, quantity });
    }

    await user.save();
    res.json(user.cart);
  } catch (err) {
    console.error("Add to cart error:", err.message);
    res.status(500).json({ error: "Failed to add to cart" });
  }
});

// ✅ Remove item from cart
router.delete("/:productId", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.cart = user.cart.filter(
      (item) => item.product.toString() !== req.params.productId
    );
    await user.save();
    res.json(user.cart);
  } catch (err) {
    console.error("Remove cart item error:", err.message);
    res.status(500).json({ error: "Failed to remove item" });
  }
});

// ✅ Clear cart
router.delete("/clear", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.cart = [];
    await user.save();
    res.json({ message: "Cart cleared" });
  } catch (err) {
    console.error("Clear cart error:", err.message);
    res.status(500).json({ error: "Failed to clear cart" });
  }
});

// ✅ Checkout and create order
router.post("/checkout", protect, async (req, res) => {
  try {
    const { cart, address, phone, totalAmount, paymentRef } = req.body;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    if (!paymentRef) {
      return res.status(400).json({ error: "Payment reference is required" });
    }

    // ✅ Verify payment with Paystack
    const verifyRes = await axios.get(
      `https://api.paystack.co/transaction/verify/${paymentRef}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const paymentData = verifyRes.data?.data;

    if (!verifyRes.data.status || paymentData.status !== "success") {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    // ✅ Create order
    const order = new Order({
      user: req.user.id,
      items: cart.map((item) => ({
        product: item.product._id || item.product,
        quantity: item.quantity,
      })),
      address,
      phone,
      totalAmount,
      paymentRef,
      status: "Paid",
      paymentMethod: "Paystack",
    });

    await order.save();

    // ✅ Clear user's cart
    const user = await User.findById(req.user.id);
    user.cart = [];
    await user.save();

    res.status(201).json({
      message: "Order placed successfully",
      orderId: order._id,
    });
  } catch (err) {
    console.error("Checkout Error:", err.message, err.stack);
    res.status(500).json({ error: err.message || "Checkout failed" });
  }
});

export default router;
