const mongoose = require("mongoose");

const errorLogSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now },
    meta: {
      message: String,
      stack: String,
      url: String,
      method: String,
    },
  },
  { collection: "error_logs_ts" },
);

module.exports = mongoose.model("error_logs_ts", errorLogSchema);
