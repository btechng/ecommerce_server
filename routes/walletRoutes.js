import express from "express";
import axios from "axios";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// 💰 Fund Wallet (Initialize Paystack)
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

// ✅ 🔐 Verify Paystack Payment and Credit Wallet
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

    const data = verifyRes.data?.data;

    if (data && data.status === "success") {
      const amount = data.amount / 100; // Convert to Naira
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });

      // ✅ Credit wallet
      user.balance = (user.balance || 0) + amount;

      user.transactions = user.transactions || [];
      user.transactions.push({
        type: "funding",
        amount,
        description: `Wallet funded via Paystack (${reference})`,
        date: new Date(),
      });

      await user.save();

      return res.json({ success: true, balance: user.balance });
    } else {
      return res.status(400).json({ error: "❌ Payment not successful" });
    }
  } catch (err) {
    console.error(
      "❌ Paystack Verification Error:",
      err.response?.data || err.message
    );
    res.status(500).json({ error: "Payment verification failed" });
  }
});

// 📡 Buy Data
router.post("/buy-data", protect, async (req, res) => {
  const { network, phone, plan, amount } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user || user.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    const ogdamsRes = await axios.post(
      "https://simhosting.ogdams.ng/api/v1/vend/data",
      {
        network,
        mobile_number: phone,
        plan,
        amount,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OGDAMS_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (ogdamsRes.data.status === true || ogdamsRes.data.status === "success") {
      user.balance -= amount;

      user.transactions = user.transactions || [];
      user.transactions.push({
        type: "data",
        amount,
        description: `${network} Data Plan for ${phone}`,
        date: new Date(),
      });

      await user.save();

      return res.json({
        message: "✅ Data purchase successful",
        data: ogdamsRes.data,
      });
    } else {
      return res.status(400).json({ error: "❌ Data purchase failed" });
    }
  } catch (err) {
    console.error("❌ Buy Data Error:", err.message);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// 📱 Buy Airtime
router.post("/buy-airtime", protect, async (req, res) => {
  const { network, phone, amount } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user || user.balance < amount) {
      return res.status(400).json({ error: "❌ Insufficient balance" });
    }

    const airtimeRes = await axios.post(
      "https://simhosting.ogdams.ng/api/v1/vend/airtime",
      {
        network,
        mobile_number: phone,
        amount,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OGDAMS_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (
      airtimeRes.data.status === true ||
      airtimeRes.data.status === "success"
    ) {
      user.balance -= amount;

      user.transactions = user.transactions || [];
      user.transactions.push({
        type: "airtime",
        amount,
        description: `${network} Airtime for ${phone}`,
        date: new Date(),
      });

      await user.save();

      return res.json({
        message: "✅ Airtime purchase successful",
        data: airtimeRes.data,
      });
    } else {
      return res.status(400).json({ error: "❌ Airtime purchase failed" });
    }
  } catch (err) {
    console.error("❌ Airtime Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Server error during airtime purchase" });
  }
});

// 📦 Get Data Plans (Updated to correct version)
router.get("/data-plans", protect, async (req, res) => {
  try {
    const response = await axios.get(
      "https://simhosting.ogdams.ng/api/v1/data/plans", // ✅ Corrected endpoint
      {
        headers: {
          Authorization: `Bearer ${process.env.OGDAMS_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const plans = response.data?.data;
    if (Array.isArray(plans)) {
      return res.json(plans);
    } else {
      return res.status(502).json({ error: "Invalid response from provider" });
    }
  } catch (err) {
    console.error(
      "❌ Data Plans Fetch Error:",
      err.response?.data || err.message
    );
    return res
      .status(500)
      .json({ error: "Internal server error fetching data plans" });
  }
});

export default router;
