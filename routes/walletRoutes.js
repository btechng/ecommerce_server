import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

dotenv.config();

const router = express.Router();

// 💰 Fund Wallet - Initialize Payment
router.post("/fund", protect, async (req, res) => {
  const { amount } = req.body;

  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: req.user.email,
        amount: amount * 100, // Paystack uses kobo
        callback_url: `${process.env.FRONTEND_URL}/wallet/callback`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error("❌ Paystack Init Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Funding initiation failed" });
  }
});

// 🔍 Verify Wallet Funding - Optional Frontend Call
router.get("/verify", protect, async (req, res) => {
  const { reference } = req.query;

  if (!reference) {
    return res.status(400).json({ error: "Missing transaction reference" });
  }

  try {
    const verifyRes = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const { status, data } = verifyRes.data;
    console.log("🔁 Paystack verification response:", data);

    if (status && data.status === "success") {
      const amount = data.amount / 100; // convert from kobo to naira
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });

      // ✅ Check if wallet already funded with this reference
      const alreadyFunded = user.transactions?.some((tx) =>
        tx.description?.includes(reference)
      );

      if (alreadyFunded) {
        console.log(`⚠️ Duplicate: Wallet already funded for ${reference}`);
        return res.json({
          success: true,
          message: "✅ Wallet already funded",
          balance: user.balance,
        });
      }

      // 💰 Fund wallet now
      user.balance = (user.balance || 0) + amount;
      user.transactions = user.transactions || [];
      user.transactions.push({
        type: "funding",
        amount,
        description: `Wallet funded via Paystack (${reference})`,
        date: new Date(),
      });

      await user.save();

      console.log(`✅ Wallet credited ₦${amount} for ${user.email}`);
      return res.json({
        success: true,
        message: "✅ Wallet funded successfully",
        balance: user.balance,
      });
    } else {
      return res
        .status(400)
        .json({ error: "❌ Payment not verified as successful" });
    }
  } catch (err) {
    console.error("❌ Verification Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

export default router;
