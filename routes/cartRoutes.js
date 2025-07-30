// cartRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Order from "../models/Order.js"; // ✅ Make sure this model exists and is imported

const router = express.Router();

// ✅ Get user's cart
router.get("/", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("cart.product");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user.cart);
  } catch (err) {
    res.status(500).json({ error: "Failed to load cart" });
  }
});

// ✅ Add to cart
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
    res.status(500).json({ error: "Failed to add to cart" });
  }
});

// ✅ Remove specific item
router.delete("/:productId", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.cart = user.cart.filter(
      (item) => item.product.toString() !== req.params.productId
    );
    await user.save();
    res.json(user.cart);
  } catch (err) {
    res.status(500).json({ error: "Failed to remove item" });
  }
});

// ✅ Clear all cart items
router.delete("/clear", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.cart = [];
    await user.save();
    res.json({ message: "Cart cleared" });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear cart" });
  }
});

// ✅ Checkout: Save order to DB
router.post("/checkout", protect, async (req, res) => {
  try {
    const { cart, address, phone, totalAmount } = req.body;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const order = new Order({
      user: req.user.id,
      items: cart.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
      })),
      address,
      phone,
      totalAmount,
    });

    await order.save();

    // Clear user cart after order is placed
    const user = await User.findById(req.user.id);
    user.cart = [];
    await user.save();

    res.status(201).json({
      message: "Order placed successfully",
      orderId: order._id,
    });
  } catch (err) {
    console.error("Checkout Error:", err);
    res.status(500).json({ error: "Checkout failed" });
  }
});

export default router;
