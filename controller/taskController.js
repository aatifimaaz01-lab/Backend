const { Task } = require("../model/task");
const { Project } = require("../model/project");
const logAction = require("../utils/actionLogger");
const logger = require("../utils/logger");

/* ================= CREATE TASK ================= */
const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      assignedTo,
      assignAll,
      projectId,
      allowedStatuses,
    } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, msg: "Project not found" });
    }

    // If assignAll is true, assign to every project member
    let members = [];
    if (assignAll) {
      members = project.members.map((m) => m.toString());
    } else if (Array.isArray(assignedTo)) {
      members = assignedTo;
    } else if (assignedTo) {
      members = [assignedTo];
    }

    const task = await Task.create({
      title,
      description,
      project: projectId,
      assignedTo: members,
      allowedStatuses:
        Array.isArray(allowedStatuses) && allowedStatuses.length > 0
          ? allowedStatuses
          : ["Pending", "In Progress", "Completed"],
      createdBy: req.user.id,
    });

    logAction({
      message: "Task created",
      userId: req.user.id,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    const populated = await Task.findById(task._id)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name");

    res.json({ success: true, data: populated });
  } catch (err) {
    logger.error("Create task failed", {
      type: "error",
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });
    res.status(500).json({ success: false, msg: "Task creation failed" });
  }
};

/* ================= GET TASKS BY PROJECT ================= */
const getTasksByProject = async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: tasks });
  } catch (err) {
    logger.error("Get tasks failed", {
      type: "error",
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });
    res.status(500).json({ success: false, msg: "Failed to fetch tasks" });
  }
};

/* ================= UPDATE TASK ================= */
const updateTask = async (req, res) => {
  try {
    const {
      title,
      description,
      assignedTo,
      assignAll,
      status,
      allowedStatuses,
    } = req.body;

    const updateData = { title, description, status };

    if (Array.isArray(allowedStatuses) && allowedStatuses.length > 0) {
      updateData.allowedStatuses = allowedStatuses;
    }

    if (assignAll) {
      const existing = await Task.findById(req.params.id);
      if (existing) {
        const project = await Project.findById(existing.project);
        if (project) {
          updateData.assignedTo = project.members.map((m) => m.toString());
        }
      }
    } else if (Array.isArray(assignedTo)) {
      updateData.assignedTo = assignedTo;
    } else if (assignedTo) {
      updateData.assignedTo = [assignedTo];
    }

    const task = await Task.findByIdAndUpdate(req.params.id, updateData, {
      returnDocument: "after",
    })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name");

    if (!task) {
      return res.status(404).json({ success: false, msg: "Task not found" });
    }

    logAction({
      message: "Task updated",
      userId: req.user.id,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.json({ success: true, data: task });
  } catch (err) {
    logger.error("Update task failed", {
      type: "error",
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });
    res.status(500).json({ success: false, msg: "Task update failed" });
  }
};

/* ================= UPDATE TASK STATUS ================= */
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, msg: "Task not found" });
    }

    // Validate status against the task's own allowed statuses
    if (!task.allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        msg: `Invalid status. Allowed: ${task.allowedStatuses.join(", ")}`,
      });
    }

    task.status = status;
    await task.save();

    const populated = await Task.findById(task._id)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name");

    if (!task) {
      return res.status(404).json({ success: false, msg: "Task not found" });
    }

    logAction({
      message: "Task status updated",
      userId: req.user.id,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.json({ success: true, data: populated });
  } catch (err) {
    logger.error("Update task status failed", {
      type: "error",
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });
    res.status(500).json({ success: false, msg: "Task status update failed" });
  }
};

/* ================= DELETE TASK ================= */
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, msg: "Task not found" });
    }

    logAction({
      message: "Task deleted",
      userId: req.user.id,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.json({ success: true });
  } catch (err) {
    logger.error("Delete task failed", {
      type: "error",
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });
    res.status(500).json({ success: false, msg: "Task deletion failed" });
  }
};

/* ================= GET TASK PROGRESS FOR PROJECT ================= */
const getProjectProgress = async (req, res) => {
  try {
    const projectId = req.params.projectId;

    const tasks = await Task.find({ project: projectId });

    const total = tasks.length;
    if (total === 0) {
      return res.json({ success: true, data: { total: 0, progress: 0 } });
    }

    let sumPercent = 0;
    tasks.forEach((t) => {
      const statuses =
        t.allowedStatuses && t.allowedStatuses.length > 0
          ? t.allowedStatuses
          : ["Pending", "In Progress", "Completed"];
      const idx = statuses.indexOf(t.status);
      const pos = idx === -1 ? 0 : idx;
      sumPercent += (pos / (statuses.length - 1)) * 100;
    });
    const progress = Math.round(sumPercent / total);

    res.json({ success: true, data: { total, progress } });
  } catch (err) {
    logger.error("Get project progress failed", {
      type: "error",
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });
    res.status(500).json({ success: false, msg: "Failed to get progress" });
  }
};

/* ================= BULK PROGRESS FOR ALL PROJECTS ================= */
const getAllProjectsProgress = async (req, res) => {
  try {
    const allTasks = await Task.find({}, "project status allowedStatuses");
    const groupMap = {};
    allTasks.forEach((t) => {
      const pid = t.project.toString();
      if (!groupMap[pid]) groupMap[pid] = { total: 0, sumPercent: 0 };
      groupMap[pid].total++;
      const statuses =
        t.allowedStatuses && t.allowedStatuses.length > 0
          ? t.allowedStatuses
          : ["Pending", "In Progress", "Completed"];
      const idx = statuses.indexOf(t.status);
      const pos = idx === -1 ? 0 : idx;
      groupMap[pid].sumPercent += (pos / (statuses.length - 1)) * 100;
    });

    const progressMap = {};
    Object.entries(groupMap).forEach(([pid, p]) => {
      progressMap[pid] = {
        total: p.total,
        progress: p.total === 0 ? 0 : Math.round(p.sumPercent / p.total),
      };
    });

    res.json({ success: true, data: progressMap });
  } catch (err) {
    logger.error("Get all projects progress failed", {
      type: "error",
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });
    res
      .status(500)
      .json({ success: false, msg: "Failed to get project progress" });
  }
};

/* ================= GET MY TASKS (ASSIGNED TO ME) ================= */
const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      project: req.params.projectId,
      assignedTo: req.user.id,
    })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: tasks });
  } catch (err) {
    logger.error("Get my tasks failed", {
      type: "error",
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });
    res.status(500).json({ success: false, msg: "Failed to fetch my tasks" });
  }
};

module.exports = {
  createTask,
  getTasksByProject,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getProjectProgress,
  getAllProjectsProgress,
  getMyTasks,
};
