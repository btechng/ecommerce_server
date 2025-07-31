import express from "express";
import TriviaQuestion from "../models/TriviaQuestion.js";

const router = express.Router();

// GET random questions
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

export default router;
