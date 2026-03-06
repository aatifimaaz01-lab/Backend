const { Project } = require("../model/project");
const logAction = require("../utils/actionLogger");
const logger = require("../utils/logger");

/* ================= CREATE PROJECT ================= */
const createProject = async (req, res) => {
  try {
    const members = req.body.members || [];

    const project = await Project.create({
      title: req.body.title,
      description: req.body.description,
      deadline: req.body.deadline,
      members,
      status: members.length > 0 ? "Assigned" : "Pending",
      createdBy: req.user.id,
    });

    logAction({
      message: "Project created",
      userId: req.user.id,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.json({ success: true, data: project });
  } catch (err) {
    logger.error("Create project failed", {
      type: "error",
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.status(500).json({ msg: "Project creation failed" });
  }
};

/* ================= UPDATE PROJECT ================= */
const updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
    });

    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }

    logAction({
      message: "Project updated",
      userId: req.user.id,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.json({ success: true, data: project });
  } catch (err) {
    logger.error("Update project failed", {
      type: "error",
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.status(500).json({ msg: "Project update failed" });
  }
};

/* ================= REMOVE MEMBER ================= */
const removeMember = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }

    project.members = project.members.filter(
      (m) => m.toString() !== employeeId,
    );

    await project.save();

    logAction({
      message: "Removed member from project",
      userId: req.user.id,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.json({ success: true, data: project });
  } catch (err) {
    logger.error("Remove member failed", {
      type: "error",
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.status(500).json({ msg: "Remove member failed" });
  }
};

/* ================= ASSIGN EMPLOYEE ================= */
const assignEmployee = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }

    if (!project.members.includes(employeeId)) {
      project.members.push(employeeId);
    }

    if (project.members.length > 0 && project.status === "Pending") {
      project.status = "Assigned";
    }

    await project.save();

    logAction({
      message: "Assigned employee to project",
      userId: req.user.id,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.json({ success: true, data: project });
  } catch (err) {
    logger.error("Assign employee failed", {
      type: "error",
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.status(500).json({ msg: "Assign employee failed" });
  }
};

/* ================= UPDATE PROJECT STATUS ================= */
const updateProjectStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: "after" },
    );

    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }

    logAction({
      message: "Project status updated",
      userId: req.user.id,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.json({ success: true, data: project });
  } catch (err) {
    logger.error("Update project status failed", {
      type: "error",
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.status(500).json({ success: false, msg: "Status update failed" });
  }
};

/* ================= GET ALL PROJECTS ================= */
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find().populate("members", "name email");

    logAction({
      message: "Viewed all projects",
      userId: req.user?.id,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.json({ success: true, data: projects });
  } catch (err) {
    logger.error("Get projects failed", {
      type: "error",
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.status(500).json({ msg: "Failed to fetch projects" });
  }
};

/* ================= DELETE PROJECT ================= */
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }

    logAction({
      message: "Project deleted",
      userId: req.user.id,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.json({ success: true });
  } catch (err) {
    logger.error("Delete project failed", {
      type: "error",
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.status(500).json({ msg: "Project deletion failed" });
  }
};

/* ================= MY PROJECTS ================= */
const myProjects = async (req, res) => {
  try {
    const projects = await Project.find({ members: req.user.id });

    logAction({
      message: "Viewed my projects",
      userId: req.user.id,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.json({ success: true, data: projects });
  } catch (err) {
    logger.error("Get my projects failed", {
      type: "error",
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.status(500).json({ msg: "Failed to fetch my projects" });
  }
};

module.exports = {
  createProject,
  assignEmployee,
  getProjects,
  myProjects,
  removeMember,
  updateProject,
  deleteProject,
  updateProjectStatus,
};
