const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone_no: { type: Number, required: true },

    Department: { type: String, required: true },

    Designation: {
      type: String,
      required: true,
    },

    salary: { type: String, required: true },

    password: { type: String },

    skills: { type: [String], default: [] },

    profilePic: { type: String, default: "" },

    documents: { type: [String], default: [] },

    join_date: { type: Date, default: Date.now },

    resetToken: String,
    resetTokenExpiry: Date,
  },
  { timestamps: true },
);

const employee_Model =
  mongoose.models.employees || mongoose.model("employees", employeeSchema);

module.exports = { employee_Model };
