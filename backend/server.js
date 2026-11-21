// Load environment variables from .env file before anything else
import dotenv from "dotenv";
dotenv.config();

// Import express for routing and server setup
import express from "express";
// Import cors to enable Cross-Origin Resource Sharing
import cors from "cors";
// Import database connection function
import connectDB from "./config/db.js";

// Import API route handlers
import studentRoutes from "./routes/studentRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import invigilatorRoutes from "./routes/invigilatorRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import allocationRoutes from "./routes/allocationRoutes.js";

// Connect to MongoDB
connectDB();

// Initialize express application
const app = express();

// Middleware: Enable Cross-Origin requests
app.use(cors());

// Middleware: Parse incoming JSON request bodies
app.use(express.json());

// API Routes
app.use("/api/students", studentRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/invigilators", invigilatorRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/allocations", allocationRoutes);

// Simple health/status route
app.get("/api/status", (req, res) => {
  res.json({ message: "AllocateX Backend is running" });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`\n=================================`);
  console.log(`🚀 SERVER RUNNING ON PORT: ${PORT}`);
  console.log(`=================================\n`);
});
