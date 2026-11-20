// Load environment variables from .env file before anything else
import dotenv from "dotenv";
dotenv.config();

// Import express for routing and server setup
import express from "express";
// Import cors to enable Cross-Origin Resource Sharing
import cors from "cors";
// Import database connection function
import connectDB from "./config/db.js";

// Connect to MongoDB
connectDB();

// Initialize express application
const app = express();

// Middleware: Enable Cross-Origin requests
app.use(cors());

// Middleware: Parse incoming JSON request bodies
app.use(express.json());

// Simple health/status route
app.get("/api/status", (req, res) => {
  res.json({ message: "AllocateX Backend is running" });
});

// Retrieve the port number from environment variables or default to 5000
const PORT = process.env.PORT || 5000;

// Start listening for incoming connections
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
