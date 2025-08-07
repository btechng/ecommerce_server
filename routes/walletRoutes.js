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
  const { email, amount } = req.body;

  if (!email || !amount) {
    return res.status(400).json({ error: "Email and amount are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

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

// ✅ Buy Airtime via Gsubz + Deduct from Wallet + Log Request
router.post("/buy-airtime", protect, async (req, res) => {
  const { serviceID, phone, amount } = req.body;

  if (!serviceID || !phone || !amount) {
    return res.status(400).json({ error: "serviceID, phone, and amount are required" });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if ((user.balance || 0) < amount) return res.status(400).json({ error: "Insufficient balance" });

    const requestID = `AIRTIME-${Date.now()}`;
    const gsubzRes = await axios.post(
      "https://gsubz.com/api/pay",
      {
        serviceID,
        amount,
        phone,
        requestID,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GSUBZ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const { status, transactionID } = gsubzRes.data;

    if (status !== "TRANSACTION_SUCCESSFUL") {
      return res.status(500).json({ error: "Airtime purchase failed", gsubzResponse: gsubzRes.data });
    }

    user.balance -= amount;
    user.transactions = user.transactions || [];
    user.transactions.push({
      type: "airtime",
      amount,
      description: `Airtime to ${phone} on ${serviceID}`,
      reference: requestID,
      status: "success",
      channel: "gsubz",
      transactionID,
      date: new Date(),
    });

    await user.save();

    await AirtimeRequest.create({
      userId: user._id,
      type: "airtime",
      network: serviceID,
      phone,
      amount,
      requestID,
      status: "processed",
    });

    console.log(`📱 Airtime ₦${amount} sent to ${phone} via ${serviceID}`);
    res.json({
      success: true,
      message: `₦${amount} airtime sent to ${phone}`,
      transactionID,
      balance: user.balance,
    });
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.message;
    console.error("❌ Airtime Error:", errorMessage);
    res.status(500).json({
      error: "Airtime purchase failed",
      details: err.response?.data || errorMessage,
    });
  }
});

export default router;
