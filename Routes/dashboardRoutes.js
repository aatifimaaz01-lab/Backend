const express = require("express");
const router = express.Router();
const verifyUser = require("../middleware/verifyuser");
const checkPermission = require("../middleware/checkPermission");
const { getDashboardSummary } = require("../controller/dashboardController");

router.get(
  "/summary",
  verifyUser,
  checkPermission("dashboard", "view"),
  getDashboardSummary,
);

module.exports = router;
