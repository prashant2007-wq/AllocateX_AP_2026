// Student Routes - API endpoints for managing students in AllocateX
import express from "express";
// Import the Student Mongoose model
import Student from "../models/Student.js";

// Initialize the Express router
const router = express.Router();

/**
 * @route   GET /api/students
 * @desc    Fetch all students from the database
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    // Retrieve all student documents from MongoDB
    const students = await Student.find();
    // Return the list of students with a 200 OK status
    res.status(200).json(students);
  } catch (error) {
    // Return a 500 Internal Server Error if something goes wrong
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/students
 * @desc    Add a new student
 * @access  Public
 */
router.post("/", async (req, res) => {
  try {
    // Create a new Student document using data sent in the request body
    const newStudent = new Student(req.body);
    // Save the student to the database
    const savedStudent = await newStudent.save();
    // Return the created student with a 201 Created status
    res.status(201).json(savedStudent);
  } catch (error) {
    // Return a 500 Internal Server Error if something goes wrong
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   PUT /api/students/:id
 * @desc    Update an existing student by ID
 * @access  Public
 */
router.put("/:id", async (req, res) => {
  try {
    // Find the student by ID and update with the request body data
    // { new: true } ensures the method returns the updated document
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    // If no student is found with the given ID
    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Return the updated student record
    res.status(200).json(updatedStudent);
  } catch (error) {
    // Return a 500 Internal Server Error if something goes wrong
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   DELETE /api/students/:id
 * @desc    Delete a student by ID
 * @access  Public
 */
router.delete("/:id", async (req, res) => {
  try {
    // Find the student by ID and remove them from the database
    const deletedStudent = await Student.findByIdAndDelete(req.params.id);

    // If no student is found with the given ID
    if (!deletedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Return a confirmation message
    res.status(200).json({ message: "Student deleted successfully" });
  } catch (error) {
    // Return a 500 Internal Server Error if something goes wrong
    res.status(500).json({ error: error.message });
  }
});

// Export the router to be used in server.js
export default router;
