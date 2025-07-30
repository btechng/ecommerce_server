const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const Product = require("../models/Product");

// ✅ Get user's cart
router.get("/", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id).populate("cart.product");
  res.json(user.cart);
});

// ✅ Add to cart
router.post("/", authMiddleware, async (req, res) => {
  const { productId, quantity } = req.body;
  const user = await User.findById(req.user.id);

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
});

// ✅ Remove specific item
router.delete("/:productId", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id);
  user.cart = user.cart.filter(
    (item) => item.product.toString() !== req.params.productId
  );
  await user.save();
  res.json(user.cart);
});

// ✅ Clear all cart items after checkout
router.delete("/clear", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id);
  user.cart = [];
  await user.save();
  res.json({ message: "Cart cleared" });
});

// ✅ Place Order (basic logging)
router.post("/checkout", authMiddleware, async (req, res) => {
  const { cart, address, phone, totalAmount } = req.body;

  // You can store in a real Order model here
  console.log("🧾 Order Received:", {
    user: req.user.id,
    cart,
    address,
    phone,
    totalAmount,
  });

  res.json({ message: "Order received and processing..." });
});

module.exports = router;
