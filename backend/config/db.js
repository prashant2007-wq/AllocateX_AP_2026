// Import mongoose to interact with MongoDB
import mongoose from "mongoose";

/**
 * Connect to MongoDB database
 * Uses the connection string defined in process.env.MONGO_URI
 */
const connectDB = async () => {
  try {
    // Attempt to establish a connection to the MongoDB cluster/instance
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    // Log any connection failure details
    console.error(`MongoDB connection error: ${error.message}`);
    // Terminate the Node.js process immediately with an exit code of 1 (failure)
    process.exit(1);
  }
};

// Export connectDB as the default export
export default connectDB;
