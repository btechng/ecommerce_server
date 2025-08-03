import express from "express";
import axios from "axios";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// 💰 Fund Wallet (Initiate Paystack)
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
    console.error("Paystack Init Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Funding initiation failed" });
  }
});

// 📡 Buy Data (Ogdams API)
router.post("/buy-data", protect, async (req, res) => {
  const { network, phone, plan, amount } = req.body;

  try {
    const user = await User.findById(req.user.id);

    if (!user || user.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    const ogdamsRes = await axios.post(
      "https://ogdams.com/api/data",
      {
        network,
        phone,
        plan,
        amount,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OGDAMS_API_KEY}`,
        },
      }
    );

    if (ogdamsRes.data.status === "success") {
      user.balance -= amount;
      await user.save();

      return res.json({
        message: "✅ Data purchase successful",
        data: ogdamsRes.data,
      });
    } else {
      return res.status(400).json({ error: "❌ Data purchase failed" });
    }
  } catch (err) {
    console.error("Buy Data Error:", err.message);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
