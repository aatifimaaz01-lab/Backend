const mongoose = require("mongoose");

const CombinedLogSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },

    meta: {
      type: Object,
      required: true,
    },
  },
  {
    collection: "combined_logs_ts",
  },
);

module.exports = mongoose.model("CombinedLog", CombinedLogSchema);
