import express from "express";
import crypto from "crypto";
import dotenv from "dotenv";
import User from "../models/User.js";
import Order from "../models/Order.js";

dotenv.config();

const router = express.Router();

router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const secret = process.env.PAYSTACK_SECRET_KEY;

    const hash = crypto
      .createHmac("sha512", secret)
      .update(req.body)
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(401).send("❌ Invalid Paystack signature");
    }

    const event = JSON.parse(req.body);

    if (event.event === "charge.success") {
      const data = event.data;
      const reference = data.reference;
      const amount = data.amount / 100; // Convert from kobo to Naira
      const email = data.customer.email;

      try {
        let processed = false;

        // 🧾 1. Check if it's for an existing Order
        const order = await Order.findOne({ paymentRef: reference });

        if (order && order.status !== "Paid") {
          order.status = "Paid";
          order.paymentMethod = "Paystack";
          await order.save();

          console.log("✅ Order marked as paid via webhook:", order._id);
          processed = true;
        }

        // 💰 2. If not an order, treat as wallet top-up
        if (!processed) {
          const user = await User.findOne({ email });

          if (user) {
            user.balance += amount;
            await user.save();

            console.log(`💰 Wallet funded: ₦${amount} for ${email}`);
            processed = true;
          }
        }

        if (!processed) {
          console.warn(
            "⚠️ No matching order or user found for reference:",
            reference
          );
        }
      } catch (err) {
        console.error("🚨 Webhook processing error:", err.message);
      }
    }

    res.sendStatus(200);
  }
);

export default router;
