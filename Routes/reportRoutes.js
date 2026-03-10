const express = require("express");
const router = express.Router();

const verifyUser = require("../middleware/verifyuser");
const checkPermission = require("../middleware/checkPermission");

const {
  createReport,
  getReport,
  getAttendanceReport,
} = require("../controller/reportController");

router.post(
  "/create",
  verifyUser,
  checkPermission("reports", "create"),
  createReport,
);
router.get("/:id", verifyUser, checkPermission("reports", "view"), getReport);
router.post(
  "/attendance/generate",
  verifyUser,
  checkPermission("reports", "create"),
  getAttendanceReport,
);

module.exports = router;
