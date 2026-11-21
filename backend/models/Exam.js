// Exam Model - Represents scheduled exams and their enrolled students
import mongoose from "mongoose";

// Schema definition for Exam
const examSchema = new mongoose.Schema({
  examName: {
    type: String,
    required: true,
  },
  courseCode: {
    type: String,
    required: true,
  },
  examDate: {
    type: String,
    required: true,
  },
  examSlot: {
    type: String,
    required: true,
  },
  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },
  ],
});

// Create and export the Exam model
const Exam = mongoose.model("Exam", examSchema);

export default Exam;
