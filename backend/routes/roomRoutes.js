// Room Routes - API endpoints for managing rooms in AllocateX
import express from "express";
// Import the Room Mongoose model
import Room from "../models/Room.js";

// Initialize the Express router
const router = express.Router();

/**
 * @route   GET /api/rooms
 * @desc    Fetch all rooms from the database
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    // Retrieve all room documents from MongoDB
    const rooms = await Room.find();
    // Return the list of rooms with a 200 OK status
    res.status(200).json(rooms);
  } catch (error) {
    // Return a 500 Internal Server Error if something goes wrong
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/rooms
 * @desc    Add a new room
 * @access  Public
 */
router.post("/", async (req, res) => {
  try {
    // Create a new Room document using the data from the request body
    const newRoom = new Room(req.body);
    // Save the room to the database
    const savedRoom = await newRoom.save();
    // Return the created room with a 201 Created status
    res.status(201).json(savedRoom);
  } catch (error) {
    // Return a 500 Internal Server Error if something goes wrong
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   PUT /api/rooms/:id
 * @desc    Update an existing room by ID
 * @access  Public
 */
router.put("/:id", async (req, res) => {
  try {
    // Find the room by ID and update with the new data
    // { new: true } returns the updated room document
    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    // If no room is found with the given ID
    if (!updatedRoom) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Return the updated room record
    res.status(200).json(updatedRoom);
  } catch (error) {
    // Return a 500 Internal Server Error if something goes wrong
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   DELETE /api/rooms/:id
 * @desc    Delete a room by ID
 * @access  Public
 */
router.delete("/:id", async (req, res) => {
  try {
    // Find the room by ID and delete it from the database
    const deletedRoom = await Room.findByIdAndDelete(req.params.id);

    // If no room is found with the given ID
    if (!deletedRoom) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Return a confirmation message
    res.status(200).json({ message: "Room deleted successfully" });
  } catch (error) {
    // Return a 500 Internal Server Error if something goes wrong
    res.status(500).json({ error: error.message });
  }
});

// Export the router to be used in server.js
export default router;
