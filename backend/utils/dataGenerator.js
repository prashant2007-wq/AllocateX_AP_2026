import Student from "../models/Student.js";
import Room from "../models/Room.js";
import Invigilator from "../models/Invigilator.js";
import Exam from "../models/Exam.js";
import Allocation from "../models/Allocation.js";

const FIRST_NAMES = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Reyansh", "Sai", "Ayaan", "Ishan", "Shaurya",
  "Atharv", "Krishna", "Dhruv", "Kabir", "Ritvik", "Ananya", "Diya", "Saanvi", "Aadhya", "Pari",
  "Avani", "Myra", "Ira", "Kiara", "Riya", "Sneha", "Pooja", "Rahul", "Rohan", "Priya",
  "Amit", "Neha", "Rohit", "Vikram", "Anjali", "Tanvi", "Varun", "Siddharth", "Meera", "Nikhil",
  "Swati", "Gaurav", "Divya", "Harsh", "Ritu", "Deepak", "Akash", "Pooja", "Kunal", "Shreya"
];

const LAST_NAMES = [
  "Sharma", "Verma", "Patel", "Singh", "Kumar", "Gupta", "Reddy", "Rao", "Joshi", "Shah",
  "Mehta", "Nair", "Pillai", "Iyer", "Chatterjee", "Banerjee", "Mukherjee", "Das", "Bose", "Mishra",
  "Pandey", "Yadav", "Tiwari", "Chauhan", "Bhat", "Agarwal", "Kulkarni", "Deshmukh", "Malhotra", "Kapoor"
];

const FACULTY_NAMES = [
  "Dr. Rajesh Sharma", "Prof. Sunita Rao", "Dr. Amit Verma", "Prof. Priya Nair",
  "Dr. Vikram Malhotra", "Prof. Kavita Iyer", "Dr. Suresh Reddy", "Prof. Meenakshi Joshi",
  "Dr. Anil Gupta", "Prof. Vandana Singh", "Dr. Ramesh Kulkarni", "Prof. Deepa Bhat",
  "Dr. Arvind Patel", "Prof. Radhika Deshmukh", "Dr. Sanjay Banerjee", "Prof. Anupama Mukherjee"
];

const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Information Technology",
  "Electronics & Communication",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Applied Mathematics",
  "Physics"
];

/**
 * Generate full synthetic dataset and exam for seating allocation
 */
export async function generateSyntheticData({
  studentCount = 100,
  sectionCount = 4,
  roomCount = 3,
  roomRows = 6,
  roomColumns = 8,
  invigilatorCount = 3,
  examName = "Mid-Term Examination 2026",
  courseCode = "CS301",
  examDate,
  examSlot = "Morning",
  clearOldData = true,
}) {
  const sCount = Number(studentCount);
  const secCount = Number(sectionCount);
  const rCount = Number(roomCount);
  const rows = Number(roomRows);
  const cols = Number(roomColumns);
  const invCount = Number(invigilatorCount);

  if (!sCount || sCount <= 0) {
    const error = new Error("studentCount must be greater than 0");
    error.statusCode = 400;
    throw error;
  }

  if (!secCount || secCount < 2) {
    const error = new Error("sectionCount must be at least 2");
    error.statusCode = 400;
    throw error;
  }

  if (!rCount || rCount <= 0 || !rows || rows <= 0 || !cols || cols <= 0) {
    const error = new Error("roomCount, roomRows, and roomColumns must be greater than 0");
    error.statusCode = 400;
    throw error;
  }

  if (invCount < 0) {
    const error = new Error("invigilatorCount cannot be negative");
    error.statusCode = 400;
    throw error;
  }

  // a) Clear old data if requested
  if (clearOldData) {
    await Promise.all([
      Student.deleteMany({}),
      Room.deleteMany({}),
      Invigilator.deleteMany({}),
      Exam.deleteMany({}),
      Allocation.deleteMany({}),
    ]);
  }

  const existingStudentCount = clearOldData ? 0 : await Student.countDocuments();
  const existingRoomCount = clearOldData ? 0 : await Room.countDocuments();
  const existingInvigilatorCount = clearOldData ? 0 : await Invigilator.countDocuments();

  // b) Generate students spread evenly across sections
  const sectionLetters = [];
  for (let s = 0; s < secCount; s++) {
    sectionLetters.push(String.fromCharCode(65 + s));
  }

  const studentDocs = [];
  for (let i = 0; i < sCount; i++) {
    const rollIndex = existingStudentCount + i + 1;
    const rollNumber = `CS26${String(rollIndex).padStart(3, "0")}`;
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
    const section = sectionLetters[i % secCount];

    studentDocs.push({
      name: `${firstName} ${lastName}`,
      rollNumber,
      section,
      semester: 6,
    });
  }

  const createdStudents = await Student.insertMany(studentDocs);
  const studentIds = createdStudents.map((s) => s._id);

  // c) Generate rooms
  const roomDocs = [];
  for (let r = 0; r < rCount; r++) {
    const roomNumber = 101 + existingRoomCount + r;
    roomDocs.push({
      roomName: `Room ${roomNumber}`,
      building: "Main Academic Block",
      rows,
      columns: cols,
      isActive: true,
    });
  }
  const createdRooms = await Room.insertMany(roomDocs);

  // d) Generate invigilators
  const invigilatorDocs = [];
  for (let inv = 0; inv < invCount; inv++) {
    const idx = existingInvigilatorCount + inv;
    const baseName = FACULTY_NAMES[idx % FACULTY_NAMES.length];
    const nameSuffix = idx >= FACULTY_NAMES.length ? ` (${Math.floor(idx / FACULTY_NAMES.length) + 1})` : "";
    const department = DEPARTMENTS[idx % DEPARTMENTS.length];

    invigilatorDocs.push({
      name: `${baseName}${nameSuffix}`,
      department,
      isAvailable: true,
    });
  }
  const createdInvigilators = await Invigilator.insertMany(invigilatorDocs);

  // e) Create one exam containing ALL generated students
  const resolvedDate = examDate || new Date().toISOString().split("T")[0];
  const newExam = new Exam({
    examName: examName || "Mid-Term Examination 2026",
    courseCode: courseCode || "CS301",
    examDate: resolvedDate,
    examSlot: examSlot || "Morning",
    students: studentIds,
  });
  const savedExam = await newExam.save();

  // f) Return counts, exam _id, and totalSeats
  const totalSeats = rCount * rows * cols;
  const warnings = [];
  if (totalSeats < sCount) {
    warnings.push(`Total seats (${totalSeats}) is less than total students (${sCount}). Some students will remain unallocated.`);
  }
  if (invCount < rCount) {
    warnings.push(`Invigilator count (${invCount}) is less than room count (${rCount}). Some rooms will not have an assigned invigilator.`);
  }

  return {
    examId: savedExam._id,
    totalSeats,
    counts: {
      students: createdStudents.length,
      sections: secCount,
      rooms: createdRooms.length,
      invigilators: createdInvigilators.length,
    },
    warnings,
  };
}

/**
 * Clear all data in the system
 */
export async function clearAllData() {
  await Promise.all([
    Student.deleteMany({}),
    Room.deleteMany({}),
    Invigilator.deleteMany({}),
    Exam.deleteMany({}),
    Allocation.deleteMany({}),
  ]);
  return { message: "All data cleared successfully" };
}
