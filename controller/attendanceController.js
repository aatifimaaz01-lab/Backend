const Attendance = require("../model/attendance");
const { employee_Model } = require("../model/emp");
const logger = require("../utils/logger");
const auditLog = require("../utils/auditLogger");
const { sendAttendanceUpdate } = require("../Routes/attendanceStream");

const todayDate = () => new Date().toISOString().slice(0, 10);

/* ================= GET TODAY RECORD ================= */
const getToday = async (req, res) => {
  try {
    const record = await Attendance.findOne({
      employee: req.user.id,
      date: todayDate(),
    });

    let activeSession = null;

    if (record && record.sessions.length > 0) {
      const lastSession = record.sessions[record.sessions.length - 1];
      if (!lastSession.checkOut) {
        activeSession = lastSession;
      }
    }

    const data = record ? record.toObject() : null;
    if (data) data.activeSession = activeSession;

    res.json({ success: true, data });
  } catch (err) {
    logger.error("Get today's attendance failed", {
      type: "error",
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.status(500).json({ success: false });
  }
};

/* ================= CHECK IN ================= */
const checkIn = async (req, res) => {
  try {
    let record = await Attendance.findOne({
      employee: req.user.id,
      date: todayDate(),
    });

    if (!record) {
      record = await Attendance.create({
        employee: req.user.id,
        date: todayDate(),
        sessions: [],
        totalMinutes: 0,
      });
    }

    record.sessions.push({
      checkIn: new Date(),
    });

    await record.save();
    sendAttendanceUpdate();

    await auditLog({
      req,
      action: "checked in",
      entity: "attendance",
    });

    res.json({ success: true });
  } catch (err) {
    logger.error("Check-in failed", {
      type: "error",
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.status(500).json({ success: false });
  }
};

/* ================= CHECK OUT ================= */
const checkOut = async (req, res) => {
  try {
    const record = await Attendance.findOne({
      employee: req.user.id,
      date: todayDate(),
    });

    if (!record || record.sessions.length === 0) {
      return res.status(400).json({ msg: "No active session" });
    }

    const last = record.sessions[record.sessions.length - 1];

    if (last.checkOut) {
      return res.status(400).json({ msg: "Already checked out" });
    }

    last.checkOut = new Date();

    const diff = Math.floor((last.checkOut - last.checkIn) / 60000);
    last.duration = diff;

    record.totalMinutes += diff;

    await record.save();
    sendAttendanceUpdate();

    await auditLog({
      req,
      action: "checked out",
      entity: "attendance",
    });

    res.json({ success: true });
  } catch (err) {
    logger.error("Check-out failed", {
      type: "error",
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.status(500).json({ success: false });
  }
};

/* ================= GET LOGGED-IN EMPLOYEES ================= */
const getLoggedInEmployees = async (req, res) => {
  try {
    const loggedInRecords = await Attendance.find({
      date: todayDate(),
    }).populate(
      "employee",
      "name email phone_no Designation Department profilePic",
    );

    const loggedIn = loggedInRecords
      .filter((record) => {
        const lastSession = record.sessions[record.sessions.length - 1];
        return lastSession && !lastSession.checkOut;
      })
      .map((record) => record.toObject());

    res.json({ success: true, data: loggedIn });
  } catch (err) {
    logger.error("Get logged-in employees failed", {
      type: "error",
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.status(500).json({ success: false, msg: err.message });
  }
};

/* ================= GET ABSENT EMPLOYEES ================= */
const getAbsentEmployees = async (req, res) => {
  try {
    const allEmployees = await employee_Model.find({
      Designation: "Employee",
    });

    const todayAttendance = await Attendance.find({ date: todayDate() });

    const attendanceEmployeeIds = new Set(
      todayAttendance.map((a) => a.employee.toString()),
    );

    const absentees = allEmployees.filter(
      (emp) => !attendanceEmployeeIds.has(emp._id.toString()),
    );

    res.json({ success: true, data: absentees });
  } catch (err) {
    logger.error("Get absent employees failed", {
      type: "error",
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.status(500).json({ success: false, msg: err.message });
  }
};

/* ================= GET LOGGED-OUT EMPLOYEES ================= */
const getLoggedOutEmployees = async (req, res) => {
  try {
    const loggedOutRecords = await Attendance.find({
      date: todayDate(),
    }).populate("employee", "name email Designation Department profilePic");

    const loggedOut = loggedOutRecords
      .filter((record) => {
        if (record.sessions.length === 0) return false;
        const lastSession = record.sessions[record.sessions.length - 1];
        return lastSession && lastSession.checkOut;
      })
      .map((record) => record.toObject());

    res.json({ success: true, data: loggedOut });
  } catch (err) {
    logger.error("Get logged-out employees failed", {
      type: "error",
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.status(500).json({ success: false, msg: err.message });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getToday,
  getLoggedInEmployees,
  getAbsentEmployees,
  getLoggedOutEmployees,
};
