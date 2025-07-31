import express from "express";
import TriviaQuestion from "../models/TriviaQuestion.js";
import LeaderboardEntry from "../models/LeaderboardEntry.js";
import { protect } from "../middleware/authMiddleware.js"; // ✅ FIXED

const router = express.Router();

// ✅ GET random trivia questions
router.get("/random", async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 5;
    const questions = await TriviaQuestion.aggregate([
      { $sample: { size: count } },
    ]);
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch trivia questions" });
  }
});

// ✅ POST score to leaderboard (protected)
router.post("/leaderboard", protect, async (req, res) => {
  const { score } = req.body;

  if (!score || typeof score !== "number") {
    return res.status(400).json({ message: "Score must be a number" });
  }

  try {
    const entry = new LeaderboardEntry({
      userId: req.user.id,
      name: req.user.name,
      score,
    });

    await entry.save();
    res.status(201).json({ message: "Score submitted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error saving score" });
  }
});

// ✅ GET Top 10 Leaderboard entries
router.get("/leaderboard", async (req, res) => {
  try {
    const entries = await LeaderboardEntry.find().sort({ score: -1 }).limit(10);
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: "Error loading leaderboard" });
  }
});

// ✅ GET score history for logged-in user
router.get("/my-scores", protect, async (req, res) => {
  try {
    const entries = await LeaderboardEntry.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: "Failed to load your score history" });
  }
});

export default router;
