import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// 🟢 Load environment variables first
dotenv.config();

// 🟢 Import routes
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import triviaRoutes from "./routes/triviaRoutes.js";
import paystackWebhook from "./routes/paystackWebhook.js"; // ✅ Webhook route

const app = express();

// 🟢 Raw body parser for Paystack webhook — must come before express.json()
app.use(
  "/api/webhook/paystack",
  express.raw({ type: "application/json" }),
  paystackWebhook
);

// 🟢 Middlewares
app.use(cors());
app.use(express.json()); // 👈 Must come after webhook raw body route

// 🟢 Database
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ Mongo error", err));

// 🟢 Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/trivia", triviaRoutes);

// 🟢 Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
