// Import mongoose to interact with MongoDB
import mongoose from "mongoose";

/**
 * Connect to MongoDB database
 * Uses process.env.MONGO_URI, local 27017, or seamlessly spins up MongoMemoryServer
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/allocatex";
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    console.log(`MongoDB Connected: ${uri}`);
  } catch (error) {
    console.warn(`Local MongoDB at ${uri} unavailable (${error.message}). Starting in-memory MongoDB for development...`);
    try {
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      await mongoose.connect(memoryUri);
      console.log(`Connected to in-memory MongoDB at ${memoryUri}`);
    } catch (memError) {
      console.error(`MongoDB connection error: ${memError.message}`);
      process.exit(1);
    }
  }
};

export default connectDB;
