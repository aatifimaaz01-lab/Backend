const { employee_Model } = require("../model/emp");
const Attendance = require("../model/attendance");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const logger = require("../utils/logger");
const auditLog = require("../utils/auditLogger");

/**
 * ================================
 * VIEW ALL EMPLOYEES
 * ================================
 */
const view_employees = async (req, res) => {
  try {
    const employee_List = await employee_Model.find();

    await auditLog({
      req,
      action: "viewed",
      entity: "all employees",
    });

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

    await auditLog({
      req,
      action: "viewed",
      entity: "employee",
      targetEmail: employee.email,
    });

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

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const link = `${process.env.FRONTEND_URL}/set-password/${token}`;

    await transporter.sendMail({
      to: email,
      subject: "Set your account password",
      html: `
        <h2>Welcome to EmployeeMS</h2>
        <p>Please set your password using the link below:</p>
        <a href="${link}">Set Password</a>
      `,
    });

    await auditLog({
      req,
      action: "created",
      entity: "employee",
      targetEmail: email,
    });

    res.json({
      success: true,
      message: "Employee created. Password email sent.",
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

    const deletedEmail = employee.email;

    // 2️⃣ Delete employee
    await employee_Model.deleteOne({ _id: id });

    // 3️⃣ Delete all attendance records for this employee
    await Attendance.deleteMany({ employee: id });

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

    await auditLog({
      req,
      action: "viewed",
      entity: "department statistics",
    });

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

module.exports = {
  view_employees,
  insert_employees,
  delete_employees,
  update_employees,
  view_single_employee,
  departmentStats,
};
