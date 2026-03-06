const express = require("express");
const router = express.Router();

const verifyUser = require("../middleware/verifyuser");

const {
  createReport,
  getReport,
  getAttendanceReport,
} = require("../controller/reportController");

router.post("/create", verifyUser, createReport);
router.get("/:id", verifyUser, getReport);
router.post("/attendance/generate", verifyUser, getAttendanceReport);

module.exports = router;
