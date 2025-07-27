import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    await Product.deleteMany();
    await User.deleteMany();

    const adminPassword = await bcrypt.hash("admin123", 10);
    const adminUser = new User({
      name: "Admin",
      email: "admin@example.com",
      password: adminPassword,
      role: "admin"
    });
    await adminUser.save();

    const sampleProducts = [
      {
        name: "Smartphone",
        price: 299.99,
        imageUrl: "https://via.placeholder.com/200",
        category: "Electronics",
        stock: 10,
        description: "Affordable smartphone"
      },
      {
        name: "Sneakers",
        price: 89.99,
        imageUrl: "https://via.placeholder.com/200",
        category: "Fashion",
        stock: 20,
        description: "Comfortable running shoes"
      }
    ];

    await Product.insertMany(sampleProducts);
    console.log("✅ Seeded admin user and sample products");
    process.exit();
  })
  .catch(err => console.error("❌ Seeding failed:", err));