import mongoose from "mongoose";

const dataRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    network: { type: String, required: true },
    phone: { type: String, required: true },
    plan: { type: String, required: true },
    planId: { type: String },
    price: { type: Number, required: true },
    status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.model("DataRequest", dataRequestSchema);
