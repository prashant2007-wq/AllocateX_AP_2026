// Invigilator Model - Represents faculty/staff invigilators for exams
import mongoose from "mongoose";

// Schema definition for Invigilator
const invigilatorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
});

// Create and export the Invigilator model
const Invigilator = mongoose.model("Invigilator", invigilatorSchema);

export default Invigilator;
