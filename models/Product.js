import mongoose from "mongoose";
import slugify from "slugify";

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  user: { type: String, required: true },
  comment: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  date: { type: Date, default: Date.now },
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number }, // Optional for job listings
    imageUrl: { type: String },
    category: { type: String, required: true },
    categorySlug: { type: String },
    stock: { type: Number, default: 1 },
    location: { type: String },
    phoneNumber: { type: String },
    email: { type: String },

    isApproved: { type: Boolean, default: false },
    approvalDate: { type: Date }, // ✅ <-- Add this line

    reviews: [reviewSchema],
    numReviews: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-generate slug from category
productSchema.pre("save", function (next) {
  if (this.isModified("category") || !this.categorySlug) {
    this.categorySlug = slugify(this.category, { lower: true, strict: true });
  }
  next();
});

export default mongoose.model("Product", productSchema);
