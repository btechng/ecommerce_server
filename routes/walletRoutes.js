import express from "express";
import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";
import User from "../models/User.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

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
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error("❌ Fund Wallet Error:", err.message);
    res.status(500).json({ error: "Payment initialization failed" });
  }
});

// ✅ Webhook to verify Paystack transaction and fund user wallet
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const hash = crypto
      .createHmac("sha512", secret)
      .update(req.body)
      .digest("hex");
    const signature = req.headers["x-paystack-signature"];

    if (hash !== signature) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const event = JSON.parse(req.body.toString());

    if (event.event === "charge.success") {
      const email = event.data.customer.email;
      const amount = event.data.amount / 100;
      const reference = event.data.reference;

      try {
        const user = await User.findOne({ email });

        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        const alreadyExists = user.transactions?.some(
          (tx) => tx.reference === reference
        );

        if (alreadyExists) {
          console.log("⚠️ Duplicate transaction detected:", reference);
          return res.sendStatus(200);
        }

        user.balance = (user.balance || 0) + amount;
        user.transactions = user.transactions || [];
        user.transactions.push({
          type: "fund",
          amount,
          description: "Wallet funded via Paystack",
          reference,
          status: "success",
          channel: event.data.channel || "paystack",
          gateway_response: event.data.gateway_response || "",
          date: new Date(),
        });

        await user.save();

        console.log(`✅ Wallet funded: ₦${amount} → ${user.email}`);
        res.sendStatus(200);
      } catch (err) {
        console.error("❌ Wallet Update Error:", err.message);
        res.status(500).json({ error: "Wallet update failed" });
      }
    } else {
      res.sendStatus(200); // Accept other events silently
    }
  }
);

// ✅ Get Wallet Balance
router.get("/balance", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("balance");
    res.json({ balance: user.balance || 0 });
  } catch (err) {
    console.error("❌ Balance Error:", err.message);
    res.status(500).json({ error: "Failed to fetch balance" });
  }
});

// ✅ Get Wallet Transactions
router.get("/transactions", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("transactions");
    res.json({ transactions: user.transactions || [] });
  } catch (err) {
    console.error("❌ Transactions Error:", err.message);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// ✅ Manual Credit by Admin
router.post("/manual-credit", protect, isAdmin, async (req, res) => {
  const { email, amount } = req.body;

  if (!email || !amount) {
    return res.status(400).json({ error: "Email and amount are required" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.balance = (user.balance || 0) + Number(amount);
    user.transactions = user.transactions || [];
    user.transactions.push({
      type: "fund",
      amount,
      description: `Manual wallet top-up by admin`,
      reference: `MANUAL-${Date.now()}`,
      status: "success",
      channel: "manual",
      date: new Date(),
    });

    await user.save();

    console.log(`✅ Manually credited ₦${amount} to ${user.email}`);
    res.json({
      success: true,
      message: `₦${amount} credited to ${user.email}`,
      balance: user.balance,
    });
  } catch (err) {
    console.error("❌ Manual Credit Error:", err.message);
    res.status(500).json({ error: "Failed to credit wallet" });
  }
});

export default router;
