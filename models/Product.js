import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  imageUrl: String,
  category: String,
  stock: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("Product", productSchema);