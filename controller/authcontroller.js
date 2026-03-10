const { employee_Model } = require("../model/emp");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const crypto = require("crypto");
const sendMail = require("../utils/sendMail");
const logger = require("../utils/logger");
const auditLog = require("../utils/auditLogger");

/* ================= LOGIN ================= */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await employee_Model.findOne({ email });

    if (!user) {
      logger.warn("Login failed - user not found", {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
      });

      return res.status(404).json({ message: "User not found" });
    }

    if (!user.password) {
      logger.warn("Login failed - password not set", {
        userId: user._id,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
      });

      return res.status(401).json({
        message:
          "Password not set. Please check your email to set your password.",
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      logger.warn("Login failed - wrong password", {
        userId: user._id,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
      });

      return res.status(401).json({ message: "Wrong password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.Designation },
      process.env.JWT_SECRET,
      { expiresIn: "5d" },
    );

    await auditLog({
      req: { ...req, user: { id: user._id } }, // ensure auditLog works
      action: "logged in",
      entity: "system",
    });

    res.json({
      success: true,
      token,
      role: user.Designation,
    });
  } catch (err) {
    logger.error("Login error", {
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.status(500).json({ message: "Login failed" });
  }
};

/* ================= PROFILE ================= */
const profile = async (req, res) => {
  try {
    const user = await employee_Model.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found",
      });
    }

    res.json({ success: true, user });
  } catch (err) {
    logger.error("Profile error", {
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.status(401).json({ success: false, msg: "Invalid token" });
  }
};

/* ================= CHANGE PASSWORD ================= */
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { current, new: newPassword } = req.body;

    // Password strength check
    if (!newPassword || newPassword.length < 8) {
      return res
        .status(400)
        .json({ msg: "Password must be at least 8 characters" });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return res
        .status(400)
        .json({ msg: "Password must contain at least one uppercase letter" });
    }
    if (!/[a-z]/.test(newPassword)) {
      return res
        .status(400)
        .json({ msg: "Password must contain at least one lowercase letter" });
    }
    if (!/[0-9]/.test(newPassword)) {
      return res
        .status(400)
        .json({ msg: "Password must contain at least one number" });
    }
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      return res
        .status(400)
        .json({ msg: "Password must contain at least one special character" });
    }

    const user = await employee_Model.findById(userId);

    const match = await bcrypt.compare(current, user.password);

    if (!match) {
      return res.status(400).json({ msg: "Current password incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    await auditLog({
      req,
      action: "changed password",
      entity: "account",
    });

    res.json({ success: true, msg: "Password updated" });
  } catch (err) {
    logger.error("Change password error", {
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.status(500).json({ msg: "Failed to change password" });
  }
};

/* ================= FORGOT PASSWORD ================= */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await employee_Model.findOne({ email });

    if (!user) return res.status(404).json({ msg: "User not found" });

    const token = crypto.randomBytes(32).toString("hex");

    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 1000 * 60 * 15;
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    await sendMail(
      email,
      "Password Reset",
      `<p>Click the link below to reset your password:</p>
       <a href="${resetLink}">${resetLink}</a>`,
    );

    await auditLog({
      req: { ...req, user: { id: user._id } },
      action: "requested password reset",
      entity: "account",
    });

    res.json({ msg: "Reset link sent to email" });
  } catch (err) {
    logger.error("Forgot password error", {
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.status(500).json({ msg: "Failed to send reset email" });
  }
};

/* ================= SET PASSWORD (ACTIVATION) ================= */
const setPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Password strength check
    if (!password || password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }
    if (!/[A-Z]/.test(password)) {
      return res
        .status(400)
        .json({
          message: "Password must contain at least one uppercase letter",
        });
    }
    if (!/[a-z]/.test(password)) {
      return res
        .status(400)
        .json({
          message: "Password must contain at least one lowercase letter",
        });
    }
    if (!/[0-9]/.test(password)) {
      return res
        .status(400)
        .json({ message: "Password must contain at least one number" });
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return res
        .status(400)
        .json({
          message: "Password must contain at least one special character",
        });
    }

    const user = await employee_Model.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Link expired" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    await auditLog({
      req: { ...req, user: { id: user._id } },
      action: "activated account",
      entity: "account",
    });

    res.json({ message: "Password set successfully" });
  } catch (err) {
    logger.error("Set password error", {
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.status(500).json({ message: "Error setting password" });
  }
};

/* ================= RESET PASSWORD ================= */
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Password strength check
    if (!password || password.length < 8) {
      return res
        .status(400)
        .json({ msg: "Password must be at least 8 characters" });
    }
    if (!/[A-Z]/.test(password)) {
      return res
        .status(400)
        .json({ msg: "Password must contain at least one uppercase letter" });
    }
    if (!/[a-z]/.test(password)) {
      return res
        .status(400)
        .json({ msg: "Password must contain at least one lowercase letter" });
    }
    if (!/[0-9]/.test(password)) {
      return res
        .status(400)
        .json({ msg: "Password must contain at least one number" });
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return res
        .status(400)
        .json({ msg: "Password must contain at least one special character" });
    }

    const user = await employee_Model.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ msg: "Token expired or invalid" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    await auditLog({
      req: { ...req, user: { id: user._id } },
      action: "reset password",
      entity: "account",
    });

    res.json({ msg: "Password reset successful" });
  } catch (err) {
    logger.error("Reset password error", {
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.status(500).json({ msg: "Error resetting password" });
  }
};

module.exports = {
  login,
  profile,
  changePassword,
  forgotPassword,
  resetPassword,
  setPassword, // ✅ kept as requested
};
