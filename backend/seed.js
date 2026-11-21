// Database Seeding Script - Populates AllocateX with sample initial data
import mongoose from "mongoose";
import dotenv from "dotenv";

// Import all 4 core Mongoose models
import Student from "./models/Student.js";
import Room from "./models/Room.js";
import Invigilator from "./models/Invigilator.js";
import Exam from "./models/Exam.js";

// Load environment variables from .env file
dotenv.config();

/**
 * Seeds the database with sample rooms, invigilators, students, and exams
 */
const seedDatabase = async () => {
  try {
    // Connect to MongoDB using the URI from environment variables
    console.log("Connecting to MongoDB for seeding...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // 1. Clear out any existing records to prevent duplicates
    console.log("Clearing existing data...");
    await Student.deleteMany({});
    await Room.deleteMany({});
    await Invigilator.deleteMany({});
    await Exam.deleteMany({});

    // 2. Sample Rooms data
    const roomsData = [
      {
        roomName: "LT-1",
        building: "Main Block",
        rows: 5,
        columns: 6,
        isActive: true,
      },
      {
        roomName: "LT-2",
        building: "Main Block",
        rows: 6,
        columns: 6,
        isActive: true,
      },
      {
        roomName: "Room 101",
        building: "CS Block",
        rows: 5,
        columns: 8,
        isActive: true,
      },
      {
        roomName: "Room 102",
        building: "CS Block",
        rows: 6,
        columns: 8,
        isActive: true,
      },
    ];
    await Room.insertMany(roomsData);
    console.log("Seeded 4 Rooms");

    // 3. Sample Invigilators data
    const invigilatorsData = [
      { name: "Dr. Alan Turing", department: "Computer Science" },
      { name: "Prof. Ada Lovelace", department: "Computer Science" },
      { name: "Dr. Katherine Johnson", department: "Mathematics" },
      { name: "Prof. John von Neumann", department: "Mathematics" },
      { name: "Dr. Claude Shannon", department: "Electrical Engineering" },
    ];
    await Invigilator.insertMany(invigilatorsData);
    console.log("Seeded 5 Invigilators");

    // 4. Sample 30 Students data
    const studentNames = [
      "Aarav Sharma", "Aditi Patel", "Akash Verma", "Ananya Singh", "Arjun Gupta",
      "Bhavna Nair", "Chetan Reddy", "Deepak Kumar", "Divya Rao", "Gaurav Joshi",
      "Isha Desai", "Karan Malhotra", "Kavya Iyer", "Manish Mehra", "Neha Bansal",
      "Nikhil Roy", "Pooja Hegde", "Pranav Mishra", "Priya Sen", "Rahul Saxena",
      "Rhea Pillai", "Rohan Bhatt", "Sakshi Dubey", "Sameer Khanna", "Siddharth Jain",
      "Simran Kaur", "Sneha Kulkarni", "Tarun Kapoor", "Varun Chopra", "Zoya Akhtar",
    ];

    const sections = ["A", "B", "C"];
    const studentsData = studentNames.map((name, index) => {
      const rollSeq = String(index + 1).padStart(3, "0");
      return {
        name,
        rollNumber: `CS24${rollSeq}`,
        section: sections[index % sections.length],
        semester: 3,
      };
    });

    const insertedStudents = await Student.insertMany(studentsData);
    console.log(`Seeded ${insertedStudents.length} Students`);

    // Extract student ObjectIds for exam assignment
    const studentIds = insertedStudents.map((student) => student._id);

    // 5. Sample Exams data
    const examsData = [
      {
        examName: "Data Structures",
        courseCode: "CS201",
        examDate: "2026-12-10",
        examSlot: "MORNING",
        students: studentIds, // Assign all 30 students to this exam
      },
      {
        examName: "Web Development",
        courseCode: "CS202",
        examDate: "2026-12-11",
        examSlot: "AFTERNOON",
        students: studentIds.slice(0, 15), // Assign first 15 students
      },
    ];
    await Exam.insertMany(examsData);
    console.log("Seeded 2 Exams");

    console.log("Data Seeded Successfully!");
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding database: ${error.message}`);
    process.exit(1);
  }
};

// Execute the seed script
seedDatabase();
