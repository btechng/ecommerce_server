import mongoose from "mongoose";

const leaderboardEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    score: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("LeaderboardEntry", leaderboardEntrySchema);
