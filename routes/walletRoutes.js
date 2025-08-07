import express from "express";
import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";
import User from "../models/User.js";
import AirtimeRequest from "../models/AirtimeRequest.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

dotenv.config();
const router = express.Router();

// 🧾 ADMIN: Get All Airtime Requests
router.get("/requests", protect, isAdmin, async (req, res) => {
  try {
    const requests = await AirtimeRequest.find().populate("userId", "name email");
    res.json(requests);
  } catch (err) {
    console.error("❌ Request Fetch Error:", err.message);
    res.status(500).json({ error: "Failed to fetch airtime requests" });
  }
});

// 💰 Fund Wallet (Initiate Paystack)
router.post("/fund", protect, async (req, res) => {
  const { amount } = req.body;

  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: req.user.email,
        amount: amount * 100,
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
        if (!user) return res.status(404).json({ error: "User not found" });

        const alreadyExists = user.transactions?.some(
          (tx) => tx.reference === reference
        );
        if (alreadyExists) return res.sendStatus(200);

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
      res.sendStatus(200);
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
  try {
    const { email, amount } = req.body;

    if (!email || !amount) {
      return res.status(400).json({ error: "email and amount are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    let wallet = await Wallet.findOne({ userId: user._id });

    if (!wallet) {
      wallet = new Wallet({ userId: user._id, balance: 0 });
    }

    wallet.balance += Number(amount);
    await wallet.save();

    res.json({
      message: `Wallet funded with ₦${amount} for ${email}`,
      wallet,
    });
  } catch (err) {
    console.error("Manual Credit Error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.post("/request-airtime", protect, async (req, res) => {
  const { network, phone, amount } = req.body;

  if (!network || !phone || !amount) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.balance < amount) {
      return res.status(400).json({ error: "Insufficient wallet balance" });
    }

    user.balance -= amount;
    user.transactions.push({
      type: "airtime-request",
      amount,
      description: `Manual Airtime request for ${phone}`,
      reference: `REQ-AIR-${Date.now()}`,
      status: "pending",
      date: new Date(),
    });

    await user.save();

    await AirtimeRequest.create({
      userId: user._id,
      type: "airtime",
      network,
      phone,
      amount,
      requestID: `REQ-AIR-${Date.now()}`,
      status: "pending",
    });

    res.json({ success: true, message: "Airtime request submitted", balance: user.balance });
  } catch (err) {
    console.error("❌ Airtime Request Error:", err.message);
    res.status(500).json({ error: "Failed to submit airtime request" });
  }
});
router.post("/request-data", protect, async (req, res) => {
  const { network, phone, plan, planId, price } = req.body;

  if (!network || !phone || !plan || !planId || !price) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.balance < price) {
      return res.status(400).json({ error: "Insufficient wallet balance" });
    }

    user.balance -= price;
    user.transactions.push({
      type: "data-request",
      amount: price,
      description: `Manual Data request (${plan}) for ${phone}`,
      reference: `REQ-DATA-${Date.now()}`,
      status: "pending",
      date: new Date(),
    });

    await user.save();

    await AirtimeRequest.create({
      userId: user._id,
      type: "data",
      network,
      phone,
      plan,
      planId,
      amount: price,
      requestID: `REQ-DATA-${Date.now()}`,
      status: "pending",
    });

    res.json({ success: true, message: "Data request submitted", balance: user.balance });
  } catch (err) {
    console.error("❌ Data Request Error:", err.message);
    res.status(500).json({ error: "Failed to submit data request" });
  }
});


export default router;
