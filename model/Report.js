let mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    filters: Object,
    status: {
      type: String,
      enum: ["Pending", "Processing", "Completed", "Failed"],
      default: "Pending",
    },
    filePath: String,
    data: Array,
  },
  { timestamps: true },
);

const report_model =
  mongoose.models.reports || mongoose.model("reports", reportSchema);

module.exports = report_model;
