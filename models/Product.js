import mongoose from "mongoose";
import slugify from "slugify";

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
    price: { type: Number }, // ✅ optional
    imageUrl: String,
    category: { type: String, required: true }, // ✅ required
    categorySlug: { type: String }, // ✅ new field for slug
    stock: { type: Number, default: 0 },
    location: String,
    phoneNumber: String,
    reviews: [reviewSchema],
    numReviews: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ✅ Automatically generate slug from category before saving
productSchema.pre("save", function (next) {
  if (this.isModified("category") || !this.categorySlug) {
    this.categorySlug = slugify(this.category, { lower: true, strict: true });
  }
  next();
});

export default mongoose.model("Product", productSchema);
