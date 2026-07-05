require("dotenv").config();
const mongoose = require("mongoose");

async function testConnection() {
  try {
    console.log("Mongo URI:", process.env.Mongo_url);

    await mongoose.connect(
      "mongodb+srv://aatifimaaz01_db_user:Aatif4733@cluster0.ljk36bw.mongodb.net/EMPLOYEE_MANAGEMENT_SYSTEM?appName=Cluster0",
    );

    console.log("✅ MongoDB connection successful");
    process.exit(0);
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
}

testConnection();
