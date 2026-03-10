let mongoose = require("mongoose");
const logger = require("../utils/logger");
require("dotenv").config();

let connectToDb = async () => {
  const mongoUrl = process.env.Mongo_url;
  if (!mongoUrl) {
    logger.error("Mongo_url environment variable is not set");
    process.exit(1);
  }

  await mongoose
    .connect(mongoUrl)
    .then(() => {
      console.log("✅ MongoDB connected");
      logger.info("MongoDB connected");
    })
    .catch((err) => {
      console.log("❌ MongoDB connection error:", err.message);
      logger.error("MongoDB connection error:", { message: err.message });
    });
};

module.exports = { connectToDb };
