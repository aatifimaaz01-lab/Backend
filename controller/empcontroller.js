const { employee_Model } = require("../model/emp");
const Attendance = require("../model/attendance");
const crypto = require("crypto");
const logger = require("../utils/logger");
const auditLog = require("../utils/auditLogger");
const sendMail = require("../utils/sendMail");

/**
 * ================================
 * VIEW ALL EMPLOYEES
 * ================================
 */
const view_employees = async (req, res) => {
  try {
    const employee_List = await employee_Model.find();

    return res.status(200).json({
      success: true,
      data: employee_List,
    });
  } catch (error) {
    logger.error("Error viewing employees", {
      type: "error",
      message: error.message,
      stack: error.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    return res.status(500).json({
      success: false,
      message: "Error fetching employees",
    });
  }
};

/**
 * ================================
 * VIEW SINGLE EMPLOYEE
 * ================================
 */
const view_single_employee = async (req, res) => {
  try {
    const id = req.params.id;
    const employee = await employee_Model.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    logger.error("Error viewing employee", {
      type: "error",
      message: error.message,
      stack: error.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    return res.status(500).json({
      success: false,
      message: "Error fetching employee",
    });
  }
};

/**
 * ================================
 * INSERT EMPLOYEE
 * ================================
 */
const insert_employees = async (req, res) => {
  try {
    const { name, email, phone_no, Department, Designation, salary, skills } =
      req.body;

    // Check if email already exists
    const existing = await employee_Model.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const newUser = await employee_Model.create({
      name,
      email,
      phone_no,
      Department,
      Designation,
      salary,
      skills,
      resetToken: token,
      resetTokenExpiry: Date.now() + 24 * 60 * 60 * 1000,
    });

    global.io.emit("employee_created", newUser);
    global.io.emit("dashboard_updated");

    const link = `${process.env.FRONTEND_URL}/set-password/${token}`;

    logger.info("Sending employee password setup email", {
      method: req.method,
      url: req.originalUrl,
      email,
      link,
    });

    let mailSent = true;

    try {
      await sendMail(
        email,
        "Set your account password",
        `
          <h2>Welcome to EmployeeMS</h2>
          <p>Please set your password using the link below:</p>
          <p><a href="${link}">Set Password</a></p>
          <p>If it does not open, copy and paste this URL:</p>
          <p>${link}</p>
        `,
        `Welcome to EmployeeMS. Set your password using this link: ${link}`,
      );

      logger.info("Employee password setup email sent", {
        method: req.method,
        url: req.originalUrl,
        email,
        link,
      });
    } catch (mailError) {
      mailSent = false;
      logger.error("Password setup email failed", {
        type: "error",
        message: mailError.message,
        stack: mailError.stack,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        email,
        link,
      });
    }

    await auditLog({
      req,
      action: "created",
      entity: "employee",
      targetEmail: email,
    });

    res.json({
      success: true,
      message: mailSent
        ? "Employee created. Password email sent."
        : "Employee created, but the password email could not be sent. Check logs and email configuration.",
    });
  } catch (error) {
    logger.error("Employee creation failed", {
      type: "error",
      message: error.message,
      stack: error.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.status(500).json({
      success: false,
      message: "Employee creation failed",
    });
  }
};

/**
 * ================================
 * DELETE EMPLOYEE
 * ================================
 */
const delete_employees = async (req, res) => {
  try {
    const id = req.params.id;

    // 1️⃣ Get employee BEFORE deleting
    const employee = await employee_Model.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // 🔒 Prevent deletion of Super Admin
    if (employee.Designation === "Super Admin") {
      return res.status(403).json({
        success: false,
        message: "Super Admin cannot be deleted",
      });
    }

    const deletedEmail = employee.email;

    // 2️⃣ Delete employee
    await employee_Model.deleteOne({ _id: id });

    // 3️⃣ Delete all attendance records for this employee
    await Attendance.deleteMany({ employee: id });

    global.io.emit("employee_deleted", id);
    global.io.emit("dashboard_updated");

    // 4️⃣ Audit log
    await auditLog({
      req,
      action: "deleted",
      entity: "employee",
      targetEmail: deletedEmail,
    });

    return res.status(200).json({
      success: true,
      message: "Employee and related attendance records deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting employee", {
      type: "error",
      message: error.message,
      stack: error.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    return res.status(500).json({
      success: false,
      message: "Error deleting employee",
    });
  }
};

/**
 * ================================
 * UPDATE EMPLOYEE
 * ================================
 */
const update_employees = async (req, res) => {
  try {
    const id = req.params.id;
    let updateData = { ...req.body };

    if (req.files?.profilePic) {
      updateData.profilePic = req.files.profilePic[0].filename;
    }

    if (req.files?.documents) {
      updateData.documents = req.files.documents.map((f) => f.filename);
    }

    const updatedEmployee = await employee_Model.findByIdAndUpdate(
      id,
      updateData,
      { new: true },
    );

    if (!updatedEmployee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    global.io.emit("employee_updated", updatedEmployee);

    await auditLog({
      req,
      action: "updated",
      entity: "employee",
      targetEmail: updatedEmployee.email,
    });

    res.json({
      success: true,
      message: "Employee updated",
      data: updatedEmployee,
    });
  } catch (err) {
    logger.error("Employee update failed", {
      type: "error",
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.status(500).json({
      success: false,
      message: "Employee update failed",
    });
  }
};

/**
 * ================================
 * DEPARTMENT STATS
 * ================================
 */
const departmentStats = async (req, res) => {
  try {
    const data = await employee_Model.aggregate([
      {
        $group: {
          _id: "$Department",
          count: { $sum: 1 },
          totalSalary: { $sum: { $toInt: "$salary" } },
        },
      },
    ]);

    res.json({ success: true, data });
  } catch (err) {
    logger.error("Department stats error", {
      type: "error",
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.status(500).json({
      success: false,
      message: "Failed to fetch department stats",
    });
  }
};

/**
 * ================================
 * CHECK EMAIL EXISTS
 * ================================
 */
const checkEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.json({ success: true, exists: false });
    }
    const existing = await employee_Model.findOne({ email });
    return res.json({ success: true, exists: !!existing });
  } catch (error) {
    logger.error("Email check failed", {
      type: "error",
      message: error.message,
      stack: error.stack,
    });
    return res
      .status(500)
      .json({ success: false, message: "Email check failed" });
  }
};

module.exports = {
  view_employees,
  insert_employees,
  delete_employees,
  update_employees,
  view_single_employee,
  departmentStats,
  checkEmail,
};
