import express from "express";
import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Admin manually credit a user wallet
router.post("/manual-credit", protect, isAdmin, async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({ error: "userId and amount are required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    let wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      wallet = new Wallet({ userId, balance: 0 });
    }

    wallet.balance += Number(amount);
    await wallet.save();

    res.json({
      message: `Wallet funded with ₦${amount} for user ${user.name || user.email}`,
      wallet,
    });
  } catch (err) {
    console.error("Manual Credit Error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
