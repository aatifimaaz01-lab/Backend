const router = require("express").Router();
const verifyUser = require("../middleware/verifyuser");
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
router.get("/logged-in", verifyUser, getLoggedInEmployees);
router.get("/logged-out", verifyUser, getLoggedOutEmployees);
router.get("/absent", verifyUser, getAbsentEmployees);

module.exports = router;
