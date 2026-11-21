// Invigilator Routes - API endpoints for managing invigilators in AllocateX
import express from "express";
// Import the Invigilator Mongoose model
import Invigilator from "../models/Invigilator.js";

// Initialize the Express router
const router = express.Router();

/**
 * @route   GET /api/invigilators
 * @desc    Fetch all invigilators from the database
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    // Retrieve all invigilator documents from MongoDB
    const invigilators = await Invigilator.find();
    // Return the list with a 200 OK status
    res.status(200).json(invigilators);
  } catch (error) {
    // Return a 500 Internal Server Error if something fails
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/invigilators
 * @desc    Add a new invigilator
 * @access  Public
 */
router.post("/", async (req, res) => {
  try {
    // Create a new Invigilator document from the request body
    const newInvigilator = new Invigilator(req.body);
    // Save to the database
    const savedInvigilator = await newInvigilator.save();
    // Return the saved invigilator with a 201 Created status
    res.status(201).json(savedInvigilator);
  } catch (error) {
    // Return a 500 Internal Server Error if something fails
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   PUT /api/invigilators/:id
 * @desc    Update an existing invigilator by ID
 * @access  Public
 */
router.put("/:id", async (req, res) => {
  try {
    // Find by ID and update with incoming data
    // { new: true } returns the document after update
    const updatedInvigilator = await Invigilator.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    // If no invigilator found with the given ID
    if (!updatedInvigilator) {
      return res.status(404).json({ message: "Invigilator not found" });
    }

    // Return the updated document
    res.status(200).json(updatedInvigilator);
  } catch (error) {
    // Return a 500 Internal Server Error if something fails
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   DELETE /api/invigilators/:id
 * @desc    Delete an invigilator by ID
 * @access  Public
 */
router.delete("/:id", async (req, res) => {
  try {
    // Find by ID and delete from the database
    const deletedInvigilator = await Invigilator.findByIdAndDelete(
      req.params.id
    );

    // If no invigilator found with the given ID
    if (!deletedInvigilator) {
      return res.status(404).json({ message: "Invigilator not found" });
    }

    // Return a confirmation message
    res.status(200).json({ message: "Invigilator deleted successfully" });
  } catch (error) {
    // Return a 500 Internal Server Error if something fails
    res.status(500).json({ error: error.message });
  }
});

// Export the router to be mounted in server.js
export default router;
