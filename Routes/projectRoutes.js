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
} = require("../controller/projectController");

const router = express.Router();

/* projects.create */
router.post(
  "/create",
  verifyUser,
  checkPermission("projects", "create"),
  createProject,
);

router.delete(
  "/delete/:id",
  verifyUser,
  checkPermission("projects", "delete"),
  deleteProject,
);

/* projects.view */
router.get(
  "/all",
  verifyUser,
  checkPermission("projects", "view"),
  getProjects,
);

router.put(
  "/update/:id",
  verifyUser,
  checkPermission("projects", "update"),
  updateProject,
);

/* All authenticated users – own projects */
router.get("/mine", verifyUser, myProjects);

router.put(
  "/update-status/:id",
  verifyUser,
  checkPermission("my_projects", "update_status"),
  updateProjectStatus,
);

module.exports = router;
