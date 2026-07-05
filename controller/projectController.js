const { Project } = require("../model/project");
const logAction = require("../utils/actionLogger");
const logger = require("../utils/logger");
// Get all projects for the logged-in client contact's company
const clientCompanyProjects = async (req, res) => {
  try {
    // req.user.id is employee _id, req.user.role is Designation
    const { employee_Model } = require("../model/emp");
    const emp = await employee_Model.findById(req.user.id);
    if (!emp || !emp.customer) {
      return res
        .status(403)
        .json({ msg: "Not a client contact or no company assigned" });
    }
    const projects = await Project.find({ customer: emp.customer })
      .populate("members", "name email")
      .lean();
    res.json({ success: true, data: projects });
  } catch (err) {
    logger.error("Client company projects failed", {
      type: "error",
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });
    res.status(500).json({ msg: "Failed to fetch company projects" });
  }
  // End of file
};
/* ================= CREATE PROJECT ================= */
const createProject = async (req, res) => {
  try {
    const members = req.body.members || [];
    const customer = req.body.customer; // company association
    if (!customer) {
      return res
        .status(400)
        .json({ msg: "Customer (company) is required for a project." });
    }

    const project = await Project.create({
      title: req.body.title,
      description: req.body.description,
      deadline: req.body.deadline,
      members,
      customer, // save company association
      status: members.length > 0 ? "Assigned" : "Pending",
      createdBy: req.user.id,
    });

    global.io.emit("project_created", project);
    global.io.emit("dashboard_updated");

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

    global.io.emit("project_updated", project);

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

    global.io.emit("project_member_removed", project);

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

    global.io.emit("project_member_added", project);

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

    global.io.emit("project_status_updated", project);

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
    let filter = {};
    // If not admin, filter by user's company
    if (!req.user.isAdmin && req.user.customer) {
      filter.customer = req.user.customer;
    }
    const projects = await Project.find(filter).populate(
      "members",
      "name email",
    );

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

    global.io.emit("project_deleted", req.params.id);
    global.io.emit("dashboard_updated");

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
    let filter = { members: req.user.id };
    // If user has a company, filter by company
    if (req.user.customer) {
      filter.customer = req.user.customer;
    }
    const projects = await Project.find(filter);

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
  clientCompanyProjects,
};
