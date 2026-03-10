const mongoose = require("mongoose");

const apiLogSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now },
    meta: {
      method: String,
      url: String,
      status: Number,
      responseTime: Number,
      message: String,
      userId: String,
      ip: String,
    },
  },
  { collection: "api_logs_ts" },
);

module.exports = mongoose.model("api_logs_ts", apiLogSchema);
