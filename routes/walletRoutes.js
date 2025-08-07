import express from "express";
import axios from "axios";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
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
        amount: amount * 100,
        callback_url: "https://ecommercengng.netlify.app/profile",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({ authorization_url: response.data.data.authorization_url });
  } catch (error) {
    res.status(500).json({ message: "Failed to initiate funding" });
  }
});

// ✅ Verify Paystack Transaction
router.post(
  "/verify",
  protect,
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const hash = require("crypto")
      .createHmac("sha512", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(401).send("Unauthorized");
    }

    const event = req.body.event;

    if (event === "charge.success") {
      const amount = req.body.data.amount / 100;
      const email = req.body.data.customer.email;

      try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).send("User not found");

        user.walletBalance += amount;
        await user.save();

        await WalletTransaction.create({
          user: user._id,
          type: "credit",
          amount,
          description: "Wallet funded via Paystack",
        });

        res.sendStatus(200);
      } catch (err) {
        res.status(500).send("Internal Server Error");
      }
    } else {
      res.sendStatus(200);
    }
  }
);

// ✅ Admin: Fund User Wallet Manually
router.post("/manual-fund", protect, adminOnly, async (req, res) => {
  const { userId, amount } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.walletBalance += amount;
    await user.save();

    await WalletTransaction.create({
      user: user._id,
      type: "credit",
      amount,
      description: "Manual funding by admin",
    });

    res.json({ message: "Wallet manually funded successfully" });
  } catch (err) {
    res.status(500).json({ message: "Manual funding failed" });
  }
});

// 📲 Buy Airtime via Gsubz API
router.post("/buy-airtime", protect, async (req, res) => {
  const { network, amount, phone } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user || user.walletBalance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const response = await axios.post(
      "https://gsubz.com/api/airtime",
      {
        network,
        amount,
        mobile_number: phone,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GSUBZ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.success) {
      user.walletBalance -= amount;
      await user.save();

      await WalletTransaction.create({
        user: user._id,
        type: "debit",
        amount,
        description: `Airtime purchase on ${phone}`,
      });

      return res.json({ message: "Airtime purchase successful" });
    } else {
      return res.status(400).json({ message: "Airtime purchase failed" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Airtime API failed" });
  }
});

// 📡 Buy Data via Gsubz API
router.post("/buy-data", protect, async (req, res) => {
  const { network, variation_id, phone, amount } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user || user.walletBalance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const response = await axios.post(
      "https://gsubz.com/api/data",
      {
        network,
        variation_id,
        mobile_number: phone,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GSUBZ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.success) {
      user.walletBalance -= amount;
      await user.save();

      await WalletTransaction.create({
        user: user._id,
        type: "debit",
        amount,
        description: `Data purchase on ${phone}`,
      });

      return res.json({ message: "Data purchase successful" });
    } else {
      return res.status(400).json({ message: "Data purchase failed" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Data API failed" });
  }
});

export default router;
