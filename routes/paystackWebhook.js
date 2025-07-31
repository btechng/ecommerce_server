import express from "express";
import crypto from "crypto";
import Order from "../models/Order.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    const hash = crypto
      .createHmac("sha512", paystackSecret)
      .update(req.body)
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(401).send("❌ Invalid signature");
    }

    const event = JSON.parse(req.body);

    if (event.event === "charge.success") {
      const data = event.data;

      try {
        // Find and update order using reference
        const order = await Order.findOne({ paymentRef: data.reference });

        if (order && order.status !== "Paid") {
          order.status = "Paid";
          order.paymentMethod = "Paystack";
          await order.save();

          console.log("✅ Order marked as paid via webhook:", order._id);
        }
      } catch (err) {
        console.error("Webhook order update error:", err);
      }
    }

    res.sendStatus(200);
  }
);

export default router;
