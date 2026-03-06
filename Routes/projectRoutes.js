const express = require("express");
const verifyUser = require("../middleware/verifyuser");
const allowRoles = require("../middleware/roleCheck");

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

/* Only Super Admin */
router.post("/create", verifyUser, allowRoles("Super Admin"), createProject);

router.delete(
  "/delete/:id",
  verifyUser,
  allowRoles("Super Admin"),
  deleteProject,
);

/* Admin + Super Admin */
router.get("/all", verifyUser, allowRoles("Admin", "Super Admin"), getProjects);

router.put(
  "/update/:id",
  verifyUser,
  allowRoles("Super Admin", "Admin"),
  updateProject,
);

/* All users */
router.get("/mine", verifyUser, myProjects);

router.put("/update-status/:id", verifyUser, updateProjectStatus);

module.exports = router;
