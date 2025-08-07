// models/AirtimeRequest.js
import mongoose from "mongoose";

const airtimeRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  phone: String,
  amount: Number,
  type: { type: String, enum: ["airtime", "data"] },
  network: String,
  plan: String, // optional, for data
  status: { type: String, enum: ["pending", "completed"], default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("AirtimeRequest", airtimeRequestSchema);
