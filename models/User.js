import mongoose from "mongoose";

// ✅ Embedded schema for user transactions
const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true, // e.g. 'fund', 'purchase', 'withdrawal', 'transfer'
    enum: ["fund", "purchase", "withdrawal", "transfer"],
  },
  channel: {
  type: String,
  default: "unknown"
},
status: {
  type: String,
  enum: ["success", "pending", "failed"],
  default: "success"
},
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  reference: {
    type: String, // e.g., Paystack reference
    default: null,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

// ✅ Main user schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    balance: {
      type: Number,
      default: 0,
    },
    recentlyViewed: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    cart: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: {
          type: Number,
          default: 1,
        },
      },
    ],
    transactions: [transactionSchema], // ✅ User transaction history
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// ✅ Export User model
export default mongoose.model("User", userSchema);
