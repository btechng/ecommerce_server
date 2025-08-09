// routes/paystackWebhook.js

import express from "express";
import crypto from "crypto";
import dotenv from "dotenv";
import User from "../models/User.js";
import Order from "../models/Order.js";

dotenv.config();

const router = express.Router();

router.post("/", async (req, res) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;

  const hash = crypto
    .createHmac("sha512", secret)
    .update(req.body)
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    return res.status(401).send("❌ Invalid Paystack signature");
  }

  let event;
  try {
    event = JSON.parse(req.body);
  } catch (err) {
    return res.status(400).send("❌ Invalid JSON payload");
  }

  if (event.event === "charge.success") {
    const data = event.data;
    const reference = data.reference;
    const amount = data.amount / 100;
    const email = data.customer.email;

    try {
      let processed = false;

      // Check for order payment
      const order = await Order.findOne({ paymentRef: reference });
      if (order && order.status !== "Paid") {
        order.status = "Paid";
        order.paymentMethod = "Paystack";
        await order.save();
        console.log("✅ Order marked as paid via webhook:", order._id);
        processed = true;
      }

      // Wallet top-up if not an order
      if (!processed) {
        const user = await User.findOne({ email });
        if (user) {
          const alreadyFunded = user.transactions?.some((tx) =>
            tx.description?.includes(reference)
          );

          if (!alreadyFunded) {
            user.balance = (user.balance || 0) + amount;
            user.transactions = user.transactions || [];
            user.transactions.push({
              type: "fund",
              amount,
              description: `Wallet funded via webhook (${reference})`,
              date: new Date(),
            });

            await user.save();
            console.log(`💰 Wallet funded: ₦${amount} for ${email}`);
          } else {
            console.log(`⚠️ Duplicate funding skipped for ${reference}`);
          }

          processed = true;
        }
      }

      if (!processed) {
        console.warn("⚠️ No matching order or user found for:", reference);
      }
    } catch (err) {
      console.error("🚨 Webhook processing error:", err.message);
    }
  }

  res.sendStatus(200); // Always respond 200 to Paystack
});

export default router;
