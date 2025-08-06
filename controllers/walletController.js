import axios from "axios";
import crypto from "crypto";
import User from "../models/User.js";
import Order from "../models/Order.js";

// 🔐 Fund Wallet - Initiate Paystack Payment
export const fundWallet = async (req, res) => {
  const { amount } = req.body;

  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: req.user.email,
        amount: amount * 100, // Paystack requires amount in kobo
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res
      .status(200)
      .json({ authorization_url: response.data.data.authorization_url });
  } catch (err) {
    console.error("Fund Wallet Error:", err.message);
    res.status(500).json({ error: "Failed to initiate payment" });
  }
};

// 🔄 Verify Wallet Funding - Paystack Webhook
export const verifyWalletFunding = async (req, res) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;

  const hash = crypto
    .createHmac("sha512", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    return res.status(400).send("Invalid signature");
  }

  const event = req.body.event;
  const data = req.body.data;

  if (event === "charge.success" && data.status === "success") {
    try {
      const email = data.customer.email;
      const amountFunded = data.amount / 100; // Convert kobo to Naira

      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ error: "User not found" });

      // Add amount to user's balance
      user.balance += amountFunded;
      await user.save();

      // Log the transaction
      await Order.create({
        userId: user._id,
        email: user.email,
        amount: amountFunded,
        type: "wallet-funding",
        status: "success",
        reference: data.reference,
      });

      res.sendStatus(200);
    } catch (err) {
      console.error("Verification Error:", err.message);
      res.sendStatus(500);
    }
  } else {
    res.sendStatus(400);
  }
};

// 👛 Get Wallet Balance
export const getWalletBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ balance: user.balance });
  } catch (err) {
    console.error("Balance Fetch Error:", err.message);
    res.status(500).json({ error: "Failed to fetch wallet balance" });
  }
};

// 🛠️ Manually Fund Wallet via Email (Admin)
export const manuallyFundWallet = async (req, res) => {
  const { email, amount } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    user.balance += amount;
    await user.save();

    // Log the manual transaction
    await Order.create({
      userId: user._id,
      email: user.email,
      amount,
      type: "manual-funding",
      status: "success",
      reference: `manual-${Date.now()}`,
    });

    res
      .status(200)
      .json({ message: `Wallet funded successfully`, balance: user.balance });
  } catch (err) {
    console.error("Manual Fund Error:", err.message);
    res.status(500).json({ error: "Failed to fund wallet manually" });
  }
};

// 📄 Get All User Wallet Transactions
export const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Order.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    res.status(200).json(transactions);
  } catch (err) {
    console.error("Fetch Transactions Error:", err.message);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};
