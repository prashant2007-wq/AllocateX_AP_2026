// Allocation Routes - API endpoints for generating and retrieving seating allocations
import express from "express";

// Import Mongoose models
import Allocation from "../models/Allocation.js";
import Exam from "../models/Exam.js";
import Room from "../models/Room.js";
import Invigilator from "../models/Invigilator.js";

// Import the seating allocation algorithm
import { generateAllocation } from "../utils/seatingAllocator.js";

// Initialize the Express router
const router = express.Router();

/**
 * @route   POST /api/allocations/generate/:examId
 * @desc    Generate a seating allocation for a specified exam and save it to the database
 * @access  Public
 */
router.post("/generate/:examId", async (req, res) => {
  try {
    const { examId } = req.params;

    // 1. Fetch the exam and populate registered students
    const exam = await Exam.findById(examId).populate("students");
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    // 2. Fetch all active rooms
    const rooms = await Room.find({ isActive: true });
    if (rooms.length === 0) {
      return res.status(400).json({ message: "No active rooms available for allocation" });
    }

    // 3. Fetch all invigilators
    const invigilators = await Invigilator.find();

    // 4. Run the seating allocation algorithm
    const result = generateAllocation(exam, exam.students, rooms, invigilators);

    // 5. Create and save the new Allocation document
    const newAllocation = new Allocation({
      exam: exam._id,
      examName: exam.examName,
      examDate: exam.examDate,
      examSlot: exam.examSlot,
      totalStudents: result.totalStudents,
      allocatedStudents: result.allocatedStudents,
      unallocatedStudents: result.unallocatedStudents,
      warnings: result.warnings,
      rooms: result.rooms,
    });

    const savedAllocation = await newAllocation.save();

    // 6. Return the saved allocation with 201 Created status
    res.status(201).json(savedAllocation);
  } catch (error) {
    // Return a 500 Internal Server Error if allocation fails
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/allocations
 * @desc    Fetch all allocations sorted by newest first
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    // Fetch all allocations sorted by generatedAt descending
    const allocations = await Allocation.find().sort({ generatedAt: -1 });
    res.status(200).json(allocations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/allocations/:id
 * @desc    Fetch a specific allocation by its ID
 * @access  Public
 */
router.get("/:id", async (req, res) => {
  try {
    const allocation = await Allocation.findById(req.params.id);
    if (!allocation) {
      return res.status(404).json({ message: "Allocation not found" });
    }
    res.status(200).json(allocation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export the router to be mounted in server.js
export default router;
