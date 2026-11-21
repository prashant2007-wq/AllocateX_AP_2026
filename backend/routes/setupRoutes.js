import express from "express";
import { generateSyntheticData, clearAllData } from "../utils/dataGenerator.js";

const router = express.Router();

/**
 * @route   POST /api/setup/generate
 * @desc    Generate synthetic dataset, exam, and return configuration
 * @access  Public
 */
router.post("/generate", async (req, res) => {
  try {
    const {
      studentCount,
      sectionCount,
      roomCount,
      roomRows,
      roomColumns,
      invigilatorCount,
      examName,
      courseCode,
      examDate,
      examSlot,
      clearOldData = true,
    } = req.body;

    // Validate inputs
    const sCount = Number(studentCount);
    const secCount = Number(sectionCount);

    if (isNaN(sCount) || sCount <= 0) {
      return res.status(400).json({ error: "studentCount must be greater than 0" });
    }

    if (isNaN(secCount) || secCount < 2) {
      return res.status(400).json({ error: "sectionCount must be at least 2" });
    }

    const result = await generateSyntheticData({
      studentCount: sCount,
      sectionCount: secCount,
      roomCount,
      roomRows,
      roomColumns,
      invigilatorCount,
      examName,
      courseCode,
      examDate,
      examSlot,
      clearOldData,
    });

    res.status(201).json({
      message: "Data generated successfully",
      ...result,
    });
  } catch (error) {
    console.error("Setup generation error:", error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: error.message || "Failed to generate setup data" });
  }
});

/**
 * @route   DELETE /api/setup/clear
 * @desc    Wipe all data from the database
 * @access  Public
 */
router.delete("/clear", async (req, res) => {
  try {
    const result = await clearAllData();
    res.json(result);
  } catch (error) {
    console.error("Clear data error:", error);
    res.status(500).json({ error: "Failed to clear data" });
  }
});

export default router;
