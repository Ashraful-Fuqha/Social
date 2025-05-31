import mongoose from "mongoose";

async function connectDB() {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URI}/${process.env.DB_NAME}?retryWrites=true&w=majority`
    );
    console.log("🌞 MongoDB connected successfully | host:", connectionInstance.connection.host);
  } catch (error) {
    console.error("😞 Error connecting to MongoDB:", error);
    process.exit(1);
  }
}

export { connectDB };