// Student Model - Represents student records registered in AllocateX
import mongoose from "mongoose";

// Schema definition for Student
const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  rollNumber: {
    type: String,
    required: true,
    unique: true,
  },
  section: {
    type: String,
    required: true,
  },
  semester: {
    type: Number,
    required: true,
  },
});

// Create and export the Student model
const Student = mongoose.model("Student", studentSchema);

export default Student;
