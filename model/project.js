let mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  deadline: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "employees" },

  status: {
    type: String,
    enum: [
      "Pending",
      "Assigned",
      "In Progress",
      "Under Review",
      "Completed",
      "On Hold",
      "Cancelled",
      "Testing",
      "Coding",
    ],
    default: "Pending",
  },

  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "employees" }],

  createdAt: { type: Date, default: Date.now },
});

const Project =
  mongoose.models.projects || mongoose.model("projects", projectSchema);

module.exports = { Project };
