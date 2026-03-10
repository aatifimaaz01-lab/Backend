const { employee_Model } = require("../model/emp");
const { Project } = require("../model/project");

const getDashboardSummary = async (req, res) => {
  try {
    const [employees, projects] = await Promise.all([
      employee_Model.find({}, "salary Department").lean(),
      Project.find({}, "title deadline status").lean(),
    ]);

    const totalSalary = employees.reduce(
      (sum, e) => sum + Number(e.salary || 0),
      0,
    );

    const deptMap = {};
    employees.forEach((e) => {
      if (e.Department) {
        deptMap[e.Department] = (deptMap[e.Department] || 0) + 1;
      }
    });

    res.json({
      success: true,
      data: {
        totalEmployees: employees.length,
        totalProjects: projects.length,
        totalSalary,
        departments: deptMap,
        projects: projects.slice(0, 5),
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to load dashboard data" });
  }
};

module.exports = { getDashboardSummary };
