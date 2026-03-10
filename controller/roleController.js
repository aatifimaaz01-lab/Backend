const { Role } = require("../model/role");
const { employee_Model } = require("../model/emp");
const auditLog = require("../utils/auditLogger");
const logger = require("../utils/logger");

// All available pages and their possible actions
const AVAILABLE_PERMISSIONS = {
  dashboard: ["view"],
  employees: ["view", "create", "update", "delete"],
  projects: ["view", "create", "update", "delete"],
  attendance: ["view", "checkin", "checkout"],
  reports: ["view", "create"],
  logs: ["view"],
  employee_status: ["view"],
  profile: ["view", "update", "change_password"],
  my_projects: ["view", "update_status"],
  roles: ["view", "create", "update", "delete"],
};

/* ================= GET PERMISSION SCHEMA ================= */
const getPermissionSchema = (req, res) => {
  res.json({ success: true, permissions: AVAILABLE_PERMISSIONS });
};

/* ================= CREATE ROLE ================= */
const createRole = async (req, res) => {
  try {
    const { name, permissions } = req.body;

    if (!name || !permissions) {
      return res
        .status(400)
        .json({ success: false, message: "Name and permissions are required" });
    }

    const existing = await Role.findOne({ name });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "Role already exists" });
    }

    const role = await Role.create({ name, permissions });

    await auditLog({
      req,
      action: `created role "${name}"`,
      entity: "role",
    });

    res.status(201).json({ success: true, role });
  } catch (err) {
    logger.error("Create role error", {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ success: false, message: "Failed to create role" });
  }
};

/* ================= GET ALL ROLES ================= */
const getRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort({ createdAt: -1 });
    res.json({ success: true, roles });
  } catch (err) {
    logger.error("Get roles error", { message: err.message, stack: err.stack });
    res.status(500).json({ success: false, message: "Failed to fetch roles" });
  }
};

/* ================= GET SINGLE ROLE ================= */
const getRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    }
    res.json({ success: true, role });
  } catch (err) {
    logger.error("Get role error", { message: err.message, stack: err.stack });
    res.status(500).json({ success: false, message: "Failed to fetch role" });
  }
};

/* ================= UPDATE ROLE ================= */
const updateRole = async (req, res) => {
  try {
    const { name, permissions } = req.body;
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    }

    if (role.isSystem && name && name !== role.name) {
      return res
        .status(403)
        .json({ success: false, message: "Cannot rename a system role" });
    }

    if (name) role.name = name;
    if (permissions) role.permissions = permissions;
    await role.save();

    await auditLog({
      req,
      action: `updated role "${role.name}"`,
      entity: "role",
    });

    res.json({ success: true, role });
  } catch (err) {
    logger.error("Update role error", {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ success: false, message: "Failed to update role" });
  }
};

/* ================= DELETE ROLE ================= */
const deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    }

    if (role.isSystem) {
      return res
        .status(403)
        .json({ success: false, message: "Cannot delete a system role" });
    }

    // Check if any employees are using this role
    const usersWithRole = await employee_Model.countDocuments({
      Designation: role.name,
    });
    if (usersWithRole > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete role – ${usersWithRole} employee(s) still assigned`,
      });
    }

    await Role.findByIdAndDelete(req.params.id);

    await auditLog({
      req,
      action: `deleted role "${role.name}"`,
      entity: "role",
    });

    res.json({ success: true, message: "Role deleted" });
  } catch (err) {
    logger.error("Delete role error", {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ success: false, message: "Failed to delete role" });
  }
};

/* ================= GET MY PERMISSIONS ================= */
const getMyPermissions = async (req, res) => {
  try {
    const user = await employee_Model.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Super Admin always has full access
    if (user.Designation === "Super Admin") {
      return res.json({ success: true, permissions: AVAILABLE_PERMISSIONS });
    }

    const role = await Role.findOne({ name: user.Designation });
    if (!role) {
      return res.json({ success: true, permissions: {} });
    }

    res.json({
      success: true,
      permissions: Object.fromEntries(role.permissions),
    });
  } catch (err) {
    logger.error("Get my permissions error", {
      message: err.message,
      stack: err.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch permissions" });
  }
};

module.exports = {
  createRole,
  getRoles,
  getRole,
  updateRole,
  deleteRole,
  getPermissionSchema,
  getMyPermissions,
  AVAILABLE_PERMISSIONS,
};
