import mongoose from "mongoose";

const triviaSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [String],
  correctAnswer: String,
  category: String, // Optional: e.g., Nigeria History, Culture, Politics
});

export default mongoose.model("TriviaQuestion", triviaSchema);
