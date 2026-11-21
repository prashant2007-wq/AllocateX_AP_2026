# AllocateX: Automated Exam Hall Seating & Invigilation System

AllocateX is a full-stack MERN application designed to streamline university examination management. It automates the complex process of mapping students to physical examination rooms, assigning invigilators, and generating visual seating charts while strictly enforcing academic integrity rules (e.g., separating students from the same section).

## 🚀 Features

* **Greedy Allocation Algorithm:** Automatically distributes students row-by-row and column-by-column, ensuring students from the same academic section are not seated adjacently.
* **Visual Seating Dashboard:** Renders physical classroom dimensions (rows x columns) into a dynamic CSS-grid seating chart with color-coded section assignments.
* **Decoupled Architecture:** Independent REST API backend and React Single Page Application (SPA) frontend.
* **Data Management:** Full CRUD operations for Students, Rooms, Invigilators, and Exams.
* **Conflict Resolution:** Built-in safeguards preventing over-capacity allocation and duplicate assignments.

## 🛠 Tech Stack

* **Frontend:** React (Vite), JavaScript, CSS3 (Grid/Flexbox)
* **Backend:** Node.js, Express.js
* **Database:** MongoDB (Mongoose Object Data Modeling)
* **Tools/Middleware:** CORS, Dotenv, Fetch API

## 🗄️ Database Architecture

The system utilizes 5 interconnected Mongoose schemas:
1. **Student:** `name`, `rollNumber`, `section`, `semester`
2. **Room:** `roomName`, `building`, `rows`, `columns`, `capacity` (calculated)
3. **Invigilator:** `name`, `department`
4. **Exam:** `examName`, `courseCode`, `examDate`, `examSlot`, `students` (Array of Refs)
5. **Allocation:** Links an `Exam` to multiple `Rooms`, containing an array of `seats` mapping coordinate points to specific `Students`.

## ⚙️ Prerequisites

Ensure you have the following installed on your local machine:
* [Node.js](https://nodejs.org/) (v16 or higher)
* [MongoDB Community Server](https://www.mongodb.com/try/download/community) (Running locally on port 27017) or a MongoDB Atlas Cloud URI.
* [Git](https://git-scm.com/)

## 💻 Installation & Local Setup

Clone the repository to your local machine:
```bash
git clone [https://github.com/prashant2007-wq/AllocateX.git](https://github.com/prashant2007-wq/AllocateX.git)
cd AllocateX

