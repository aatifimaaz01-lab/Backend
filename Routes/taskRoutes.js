const express = require("express");
const verifyUser = require("../middleware/verifyuser");
const checkPermission = require("../middleware/checkPermission");

const {
  createTask,
  getTasksByProject,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getProjectProgress,
  getAllProjectsProgress,
  getMyTasks,
} = require("../controller/taskController");

const router = express.Router();

/* tasks.create – Super Admin creates tasks */
router.post(
  "/create",
  verifyUser,
  checkPermission("tasks", "create"),
  createTask,
);

/* tasks.view – view tasks for a project */
router.get(
  "/project/:projectId",
  verifyUser,
  checkPermission("tasks", "view"),
  getTasksByProject,
);

/* tasks.update – update a task */
router.put(
  "/update/:id",
  verifyUser,
  checkPermission("tasks", "update"),
  updateTask,
);

/* Any authenticated user can update status of their tasks */
router.put("/update-status/:id", verifyUser, updateTaskStatus);

/* Get tasks assigned to the logged-in user for a project */
router.get("/my-tasks/:projectId", verifyUser, getMyTasks);

/* tasks.delete – delete a task */
router.delete(
  "/delete/:id",
  verifyUser,
  checkPermission("tasks", "delete"),
  deleteTask,
);

/* Progress – single project */
router.get("/progress/:projectId", verifyUser, getProjectProgress);

/* Progress – all projects (bulk) */
router.get("/progress-all", verifyUser, getAllProjectsProgress);

module.exports = router;
