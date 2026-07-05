let mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "projects",
    required: true,
  },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "employees" }],
  status: {
    type: String,
    default: "Pending",
  },
  allowedStatuses: {
    type: [String],
    default: ["Pending", "In Progress", "Completed"],
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "employees" },
  createdAt: { type: Date, default: Date.now },
});

const Task = mongoose.models.tasks || mongoose.model("tasks", taskSchema);

module.exports = { Task };
