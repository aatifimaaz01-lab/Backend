const { Worker } = require("bullmq");
const Redis = require("ioredis");
const fs = require("fs");
require("dotenv").config();
const mongoose = require("mongoose");

/* ---------- CONNECT MONGODB ---------- */

mongoose
  .connect(
    process.env.Mongo_url ||
      "mongodb://127.0.0.1:27017/Employee_Management_System",
  )
  .then(() => console.log("✅ Worker connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB worker connection error:", err));

/* ---------- IMPORT MODELS ---------- */

const Report = require("../model/Report");
const { Project } = require("../model/project");
const { employee_Model } = require("../model/emp");

/* ---------- REDIS CONNECTION ---------- */

const connection = new Redis({
  maxRetriesPerRequest: null,
});

/* ---------- WORKER ---------- */

new Worker(
  "reportQueue",
  async (job) => {
    const { reportId, filters } = job.data;

    try {
      console.log("📊 Generating report:", reportId);

      await Report.findByIdAndUpdate(reportId, {
        status: "Processing",
      });

      let data = [];
      let csv = "";

      /* ======================================================
         PROJECT REPORT (FULL DETAILS)
      ====================================================== */

      if (filters.type === "project") {
        const query = {};

        if (filters.startDate && filters.endDate) {
          query.createdAt = {
            $gte: new Date(filters.startDate),
            $lte: new Date(filters.endDate),
          };
        }

        const projects = await Project.find(query)
          .populate("members", "name email")
          .populate("createdBy", "name")
          .lean();

        data = projects.map((p) => ({
          title: p.title,
          description: p.description,
          status: p.status,
          deadline: p.deadline,
          createdAt: p.createdAt,
          createdBy: p.createdBy?.name || "",
          members: p.members.map((m) => m.name),
        }));

        /* ---- CSV ---- */

        csv =
          "Project Title,Description,Status,Deadline,Created Date,Created By,Members\n";

        data.forEach((r) => {
          csv += `${r.title},"${r.description || ""}",${r.status},${
            r.deadline || ""
          },${r.createdAt || ""},${r.createdBy},"${r.members.join(", ")}"\n`;
        });
      }

      /* ======================================================
         EMPLOYEE REPORT (FULL DETAILS)
      ====================================================== */

      if (filters.type === "employee") {
        const query = {};

        if (filters.startDate && filters.endDate) {
          query.createdAt = {
            $gte: new Date(filters.startDate),
            $lte: new Date(filters.endDate),
          };
        }

        const employees = await employee_Model.find(query).lean();

        data = employees.map((e) => ({
          name: e.name,
          email: e.email,
          phone: e.phone_no,
          department: e.Department,
          designation: e.Designation,
          salary: e.salary,
          joinDate: e.join_date,
        }));

        /* ---- CSV ---- */

        csv = "Name,Email,Phone,Department,Designation,Salary,Join Date\n";

        data.forEach((r) => {
          csv += `${r.name},${r.email},${r.phone},${r.department},${r.designation},${r.salary},${r.joinDate}\n`;
        });
      }

      /* ======================================================
         SAVE FILE
      ====================================================== */

      fs.mkdirSync("uploads/reports", { recursive: true });

      const filePath = `uploads/reports/report-${Date.now()}.csv`;
      fs.writeFileSync(filePath, csv);

      await Report.findByIdAndUpdate(reportId, {
        status: "Completed",
        data,
        filePath: "/" + filePath,
      });

      console.log("✅ Report generated:", filePath);

      return true;
    } catch (err) {
      console.error("❌ Worker error:", err);

      await Report.findByIdAndUpdate(reportId, {
        status: "Failed",
      });

      throw err;
    }
  },
  { connection },
);

console.log("🚀 Report worker running...");
