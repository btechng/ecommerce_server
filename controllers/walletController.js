// walletController.js
import User from "../models/userModel.js";
import AirtimeRequest from "../models/airtimeRequest.js";
import Order from "../models/orderModel.js";
import crypto from "crypto";

export const fundWallet = async (req, res) => {
  const { userId, amount, method = "manual" } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.balance = (user.balance || 0) + Number(amount);
    user.transactions = user.transactions || [];
    user.transactions.push({
      type: "credit",
      amount,
      description: `Wallet funded (${method})`,
      reference: `MANUAL-${Date.now()}`,
      status: "success",
      channel: method,
      date: new Date(),
    });

    await user.save();

    await Order.create({
      userId,
      amount,
      status: "success",
      type: "credit",
      description: `Wallet funded manually`,
    });

    res.json({ success: true, message: "Wallet funded", balance: user.balance });
  } catch (err) {
    res.status(500).json({ error: "Failed to fund wallet" });
  }
};

export const buyAirtime = async (req, res) => {
  const { phone, amount, network } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if ((user.balance || 0) < amount)
      return res.status(400).json({ error: "Insufficient balance" });

    const requestID = `AIRTIME-${Date.now()}`;

    user.balance -= amount;
    user.transactions = user.transactions || [];
    user.transactions.push({
      type: "airtime",
      amount,
      description: `Airtime to ${phone} on ${network}`,
      reference: requestID,
      status: "success",
      channel: "airtime-api",
      date: new Date(),
    });

    await user.save();

    await AirtimeRequest.create({
      userId: user._id,
      phone,
      amount,
      type: "airtime",
      network,
      requestID,
      status: "processed",
    });

    res.json({ success: true, message: `₦${amount} airtime sent`, requestID });
  } catch (err) {
    res.status(500).json({ error: "Failed to request airtime" });
  }
};

export const buyData = async (req, res) => {
  const { phone, plan, network, amount } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if ((user.balance || 0) < amount)
      return res.status(400).json({ error: "Insufficient balance" });

    const requestID = `DATA-${Date.now()}`;

    user.balance -= amount;
    user.transactions = user.transactions || [];
    user.transactions.push({
      type: "data",
      amount,
      description: `Data plan ${plan} to ${phone} on ${network}`,
      reference: requestID,
      status: "success",
      channel: "data-api",
      date: new Date(),
    });

    await user.save();

    await AirtimeRequest.create({
      userId: user._id,
      phone,
      amount,
      plan,
      type: "data",
      network,
      requestID,
      status: "processed",
    });

    res.json({ success: true, message: `₦${amount} data sent`, requestID });
  } catch (err) {
    res.status(500).json({ error: "Failed to request data" });
  }
};

export const verifyWalletFunding = async (req, res) => {
  const secret = process.env.PAYSTACK_SECRET;
  const hash = crypto
    .createHmac("sha512", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    return res.status(400).json({ error: "Invalid signature" });
  }

  const event = req.body.event;
  if (event !== "charge.success") return res.sendStatus(200);

  const { reference, amount, customer } = req.body.data;

  try {
    const user = await User.findOne({ email: customer.email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const nairaAmount = amount / 100;
    user.balance = (user.balance || 0) + nairaAmount;
    user.transactions = user.transactions || [];
    user.transactions.push({
      type: "credit",
      amount: nairaAmount,
      description: "Wallet funded via Paystack",
      reference,
      status: "success",
      channel: "paystack",
      date: new Date(),
    });

    await user.save();

    await Order.create({
      userId: user._id,
      amount: nairaAmount,
      status: "success",
      type: "credit",
      description: "Wallet funded via Paystack",
    });

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: "Webhook handling failed" });
  }
};
