import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  user: { type: String, required: true },
  comment: { type: String, required: true },
  rating: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    imageUrl: String,
    category: String,
    stock: { type: Number, default: 0 },
    location: String, // ✅ Location field
    phoneNumber: String, // ✅ Phone number field
    reviews: [reviewSchema],
    numReviews: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
