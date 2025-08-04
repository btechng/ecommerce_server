import express from "express";
import axios from "axios";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// 💰 Fund Wallet (Paystack)
router.post("/fund", protect, async (req, res) => {
  const { amount } = req.body;

  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: req.user.email,
        amount: amount * 100,
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

// 📡 Buy Data (Ogdams API)
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

// 📱 Buy Airtime (Ogdams API)
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

// 📦 Get Data Plans
router.get("/data-plans", protect, async (req, res) => {
  try {
    const response = await axios.get(
      "https://simhosting.ogdams.ng/api/v4/get/data/plans",
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
      return res.status(400).json({ error: "Invalid response from provider" });
    }
  } catch (err) {
    console.error("❌ Data Plans Fetch Error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
