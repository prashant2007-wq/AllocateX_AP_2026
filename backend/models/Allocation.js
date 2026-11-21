// Allocation Model - Represents generated seating and invigilator allocations for an exam
import mongoose from "mongoose";

// Schema definition for Allocation
const allocationSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exam",
  },
  examName: {
    type: String,
  },
  examDate: {
    type: String,
  },
  examSlot: {
    type: String,
  },
  totalStudents: {
    type: Number,
  },
  allocatedStudents: {
    type: Number,
  },
  unallocatedStudents: {
    type: Number,
  },
  warnings: [String],
  generatedAt: {
    type: Date,
    default: Date.now,
  },
  rooms: [
    {
      roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
      },
      roomName: String,
      capacity: Number,
      rows: Number,
      columns: Number,
      invigilatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Invigilator",
      },
      invigilatorName: String,
      seats: [
        {
          row: Number,
          column: Number,
          studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
          },
          studentName: String,
          rollNumber: String,
          section: String,
        },
      ],
    },
  ],
});

// Create and export the Allocation model
const Allocation = mongoose.model("Allocation", allocationSchema);

export default Allocation;
