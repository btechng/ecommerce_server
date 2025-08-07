import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// Load .env
dotenv.config();

// Routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import triviaRoutes from "./routes/triviaRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import paystackWebhook from "./routes/paystackWebhook.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();

// 🔐 Paystack webhook requires raw body middleware BEFORE express.json()
app.use(
  "/api/webhook/paystack",
  express.raw({ type: "application/json" }),
  paystackWebhook
);

// 📦 General Middleware (after webhook)
app.use(cors());
app.use(express.json());

// 🛠 MongoDB Connect
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ Mongo Error", err));

// 📁 API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/trivia", triviaRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/admin", adminRoutes);

// 🚀 Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
