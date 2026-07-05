const Report = require("../model/Report");
const { reportQueue } = require("../queues/reportQueue");
const Attendance = require("../model/attendance");
const logAction = require("../utils/actionLogger");
const logger = require("../utils/logger");

/* ================= CREATE REPORT ================= */
const createReport = async (req, res) => {
  try {
    if (!process.env.REDIS_URL) {
      return res.status(503).json({
        message: "Report generation is unavailable until REDIS_URL is configured",
      });
    }

    const filters = req.body;

    const report = await Report.create({
      filters,
      status: "Pending",
    });

    await reportQueue.add("generate-report", {
      reportId: report._id,
      filters,
    });

    logAction({
      message: "Report generation started",
      userId: req.user?.id,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.json({
      reportId: report._id,
      message: "Report generation started",
    });
  } catch (err) {
    logger.error("Create report failed", {
      type: "error",
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.status(500).json({ message: "Failed to create report" });
  }
};

/* ================= GET REPORT ================= */
const getReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    logAction({
      message: "Viewed report",
      userId: req.user?.id,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.json({
      status: report.status,
      data: report.data || [],
      downloadUrl: report.filePath || "",
    });
  } catch (err) {
    logger.error("Get report failed", {
      type: "error",
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.status(500).json({ message: "Error fetching report" });
  }
};

/* ================= ATTENDANCE REPORT ================= */
const getAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.body;

    let query = {
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    // Get all employees
    const { employee_Model } = require("../model/emp");
    let empFilter = {};
    if (employeeId && employeeId !== "all") {
      empFilter = { _id: employeeId };
    } else {
      empFilter = {
        Designation: { $nin: ["Super Admin", "Admin"] },
      };
    }
    const employees = await employee_Model
      .find(empFilter)
      .select("name email Designation Department");

    // Get all attendance records in range
    const attendanceRecords = await Attendance.find(query)
      .populate("employee", "name email Designation Department")
      .sort({ date: 1 });

    // Group attendance by employee and date
    const attMap = {};
    for (const record of attendanceRecords) {
      if (!record.employee) continue;
      const empId = record.employee._id.toString();
      if (!attMap[empId]) attMap[empId] = {};
      attMap[empId][record.date] = record;
    }

    // Build report for each employee and each date in range
    const reportData = [];
    // Build date array
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dateArr = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dateArr.push(d.toISOString().slice(0, 10));
    }

    for (const emp of employees) {
      for (const date of dateArr) {
        const record =
          attMap[emp._id.toString()] && attMap[emp._id.toString()][date];
        if (record) {
          // Find first check-in and last check-out for the date
          let firstCheckIn = null;
          let lastCheckOut = null;
          let totalMinutes = 0;
          for (const session of record.sessions) {
            if (
              session.checkIn &&
              (!firstCheckIn || session.checkIn < firstCheckIn)
            ) {
              firstCheckIn = session.checkIn;
            }
            if (
              session.checkOut &&
              (!lastCheckOut || session.checkOut > lastCheckOut)
            ) {
              lastCheckOut = session.checkOut;
            }
            totalMinutes += session.duration || 0;
          }
          reportData.push({
            employeeId: emp._id,
            name: emp.name,
            email: emp.email,
            designation: emp.Designation,
            department: emp.Department,
            date,
            firstCheckIn: firstCheckIn
              ? new Date(firstCheckIn).toLocaleTimeString()
              : "N/A",
            lastCheckOut: lastCheckOut
              ? new Date(lastCheckOut).toLocaleTimeString()
              : "N/A",
            totalHours: (totalMinutes / 60).toFixed(2),
          });
        } else {
          // No attendance for this employee/date
          reportData.push({
            employeeId: emp._id,
            name: emp.name,
            email: emp.email,
            designation: emp.Designation,
            department: emp.Department,
            date,
            firstCheckIn: "N/A",
            lastCheckOut: "N/A",
            totalHours: "0.00",
          });
        }
      }
    }

    // Sort by employee name, then date
    reportData.sort((a, b) => {
      if (a.name !== b.name) return a.name.localeCompare(b.name);
      return a.date.localeCompare(b.date);
    });

    const report = await Report.create({
      filters: { type: "attendance", startDate, endDate, employeeId },
      status: "Completed",
      data: reportData,
    });

    logAction({
      message: "Attendance report generated",
      userId: req.user?.id,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.json({
      success: true,
      reportId: report._id,
      status: "Completed",
      data: reportData,
    });
  } catch (err) {
    logger.error("Attendance report generation failed", {
      type: "error",
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.status(500).json({
      success: false,
      message: "Attendance report failed",
    });
  }
};

module.exports = {
  createReport,
  getReport,
  getAttendanceReport,
};
