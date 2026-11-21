// Room Model - Represents examination rooms/halls with seating capacity
import mongoose from "mongoose";

// Schema definition for Room
const roomSchema = new mongoose.Schema({
  roomName: {
    type: String,
    required: true,
  },
  building: {
    type: String,
    required: true,
  },
  rows: {
    type: Number,
    required: true,
  },
  columns: {
    type: Number,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

// Create and export the Room model
const Room = mongoose.model("Room", roomSchema);

export default Room;
