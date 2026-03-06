let mongoose = require("mongoose");
const logger = require("../utils/logger");
require("dotenv").config();

let connectToDb = async () => {
  await mongoose
    .connect(
      process.env.Mongo_Url ||
        "mongodb+srv://aatifimaaz4_db_user:E99TxOAD7GGfOKrK@cluster0.2bzlj4i.mongodb.net/employees?retryWrites=true&w=majority",
    )
    .then(() => {
      console.log(console.log("✅ MongoDB connected"));
      logger.info("MongoDB connected");
    })
    .catch((err) => {
      console.log("❌ MongoDB connection error:", err);
      logger.error("MongoDB connection error:", err);
    });
};

module.exports = { connectToDb };
