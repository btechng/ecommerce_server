import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import Product from "./models/Product.js"; // ✅ Make sure this path is correct

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

// 📌 Dynamic OG Meta Tags for Product Pages
app.get("/product/:id", async (req, res, next) => {
  try {
    const userAgent = req.headers["user-agent"] || "";
    const isBot = /facebookexternalhit|twitterbot|whatsapp|discord|linkedin|googlebot/i.test(userAgent);

    if (isBot) {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).send("Product not found");
      }

      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <title>${product.name}</title>
          <meta name="description" content="${product.description?.substring(0, 150) || ''}" />

          <!-- Open Graph -->
          <meta property="og:title" content="${product.name}" />
          <meta property="og:description" content="${product.description?.substring(0, 150) || ''}" />
          <meta property="og:image" content="${product.image}" />
          <meta property="og:url" content="${process.env.BASE_URL}/product/${product._id}" />
          <meta property="og:type" content="product" />

          <!-- Twitter -->
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="${product.name}" />
          <meta name="twitter:description" content="${product.description?.substring(0, 150) || ''}" />
          <meta name="twitter:image" content="${product.image}" />
        </head>
        <body>
          Redirecting...
         <script>window.location.href = "/product/${product._id}";</script>
        </body>
        </html>
      `;
      return res.send(html);
    }

    // If not a bot → continue to normal frontend route
    next();
  } catch (err) {
    console.error(err);
    next();
  }
});

// 📌 Serve React frontend
const __dirnamePath = path.resolve();
app.use(express.static(path.join(__dirnamePath, "client/dist"))); // adjust build path

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirnamePath, "client/dist", "index.html"));
});

// 🚀 Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
