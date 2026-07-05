const express = require("express");
const verifyUser = require("../middleware/verifyuser");
const checkPermission = require("../middleware/checkPermission");
const {
  createProject,
  assignEmployee,
  getProjects,
  myProjects,
  removeMember,
  deleteProject,
  updateProject,
  updateProjectStatus,
  clientCompanyProjects,
} = require("../controller/projectController");

const router = express.Router();

// ================= CLIENT COMPANY =================
// Get all projects for client's company (for client contacts)
router.get("/company-projects", verifyUser, clientCompanyProjects);

// ================= CREATE =================
router.post(
  "/create",
  verifyUser,
  checkPermission("projects", "create"),
  createProject,
);

// ================= ASSIGN EMPLOYEE =================
router.post(
  "/assign/:id",
  verifyUser,
  checkPermission("projects", "update"),
  assignEmployee,
);

// ================= REMOVE MEMBER =================
router.put(
  "/remove-member/:id",
  verifyUser,
  checkPermission("projects", "update"),
  removeMember,
);

// ================= DELETE =================
router.delete(
  "/delete/:id",
  verifyUser,
  checkPermission("projects", "delete"),
  deleteProject,
);

// ================= VIEW ALL =================
router.get(
  "/all",
  verifyUser,
  checkPermission("projects", "view"),
  getProjects,
);

// ================= UPDATE =================
router.put(
  "/update/:id",
  verifyUser,
  checkPermission("projects", "update"),
  updateProject,
);

// ================= MY PROJECTS =================
router.get("/mine", verifyUser, myProjects);

// ================= UPDATE STATUS =================
router.put(
  "/update-status/:id",
  verifyUser,
  checkPermission("my_projects", "update_status"),
  updateProjectStatus,
);

module.exports = router;
