const router = require("express").Router();
const verifyUser = require("../middleware/verifyuser");
const checkPermission = require("../middleware/checkPermission");
const {
  checkIn,
  checkOut,
  getToday,
  getLoggedInEmployees,
  getAbsentEmployees,
  getLoggedOutEmployees,
} = require("../controller/attendanceController");

router.get("/today", verifyUser, getToday);
router.post("/checkin", verifyUser, checkIn);
router.post("/checkout", verifyUser, checkOut);
router.get(
  "/logged-in",
  verifyUser,
  checkPermission("employee_status", "view"),
  getLoggedInEmployees,
);
router.get(
  "/logged-out",
  verifyUser,
  checkPermission("employee_status", "view"),
  getLoggedOutEmployees,
);
router.get(
  "/absent",
  verifyUser,
  checkPermission("employee_status", "view"),
  getAbsentEmployees,
);

module.exports = router;
