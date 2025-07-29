import mongoose from "mongoose";
import dotenv from "dotenv";
import slugify from "slugify";
import Product from "../models/Product.js"; // adjust path if needed

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("DB connected");

    const products = await Product.find();

    for (let product of products) {
      const correctSlug = slugify(product.category, {
        lower: true,
        strict: true,
      });

      if (product.categorySlug !== correctSlug) {
        product.categorySlug = correctSlug;
        await product.save();
        console.log(`Updated: ${product.name} → ${correctSlug}`);
      }
    }

    console.log("Slug update complete.");
    process.exit();
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
};

run();
