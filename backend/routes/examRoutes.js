// Exam Routes - API endpoints for managing exams and student registrations in AllocateX
import express from "express";
// Import the Exam Mongoose model
import Exam from "../models/Exam.js";

// Initialize the Express router
const router = express.Router();

/**
 * @route   GET /api/exams
 * @desc    Fetch all exams with complete student details populated
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    // Query all exams and populate the "students" field to get full Student objects
    const exams = await Exam.find().populate("students");
    // Return the list with a 200 OK status
    res.status(200).json(exams);
  } catch (error) {
    // Return a 500 Internal Server Error if query fails
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/exams/:id
 * @desc    Fetch a single exam by ID with populated student details
 * @access  Public
 */
router.get("/:id", async (req, res) => {
  try {
    // Find exam by ID and populate its registered students
    const exam = await Exam.findById(req.params.id).populate("students");

    // If exam does not exist
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    // Return the populated exam
    res.status(200).json(exam);
  } catch (error) {
    // Return a 500 Internal Server Error if query fails
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/exams
 * @desc    Create a new exam
 * @access  Public
 */
router.post("/", async (req, res) => {
  try {
    // Create new exam instance with request payload
    const newExam = new Exam(req.body);
    // Save to the database
    const savedExam = await newExam.save();
    // Return the created exam with a 201 Created status
    res.status(201).json(savedExam);
  } catch (error) {
    // Return a 500 Internal Server Error if save fails
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   PUT /api/exams/:id
 * @desc    Update an existing exam by ID
 * @access  Public
 */
router.put("/:id", async (req, res) => {
  try {
    // Find exam by ID and update with new details
    // { new: true } returns the updated exam document
    const updatedExam = await Exam.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    // If exam does not exist
    if (!updatedExam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    // Return the updated exam
    res.status(200).json(updatedExam);
  } catch (error) {
    // Return a 500 Internal Server Error if update fails
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   DELETE /api/exams/:id
 * @desc    Delete an exam by ID
 * @access  Public
 */
router.delete("/:id", async (req, res) => {
  try {
    // Find exam by ID and remove from database
    const deletedExam = await Exam.findByIdAndDelete(req.params.id);

    // If exam does not exist
    if (!deletedExam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    // Return confirmation message
    res.status(200).json({ message: "Exam deleted successfully" });
  } catch (error) {
    // Return a 500 Internal Server Error if delete fails
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/exams/:id/register
 * @desc    Register a student for an exam by studentId
 * @access  Public
 */
router.post("/:id/register", async (req, res) => {
  try {
    const { studentId } = req.body;

    // Validate that studentId was provided in request body
    if (!studentId) {
      return res.status(400).json({ message: "studentId is required" });
    }

    // Find the exam by ID
    const exam = await Exam.findById(req.params.id);

    // If exam does not exist
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    // Check if the student is already registered in the students array
    const isAlreadyRegistered = exam.students.some(
      (id) => id.toString() === studentId.toString()
    );

    if (isAlreadyRegistered) {
      return res
        .status(400)
        .json({ message: "Student is already registered for this exam" });
    }

    // Push the studentId to the students array
    exam.students.push(studentId);

    // Save the updated exam document
    await exam.save();

    // Return success response
    res.status(200).json({
      message: "Student registered successfully",
      exam,
    });
  } catch (error) {
    // Return a 500 Internal Server Error if registration fails
    res.status(500).json({ error: error.message });
  }
});

// Export the router to be mounted in server.js
export default router;
