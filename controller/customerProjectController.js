// Get all projects for a specific customer
const { Project } = require("../model/project");

const getProjectsByCustomer = async (req, res) => {
  try {
    const customerId = req.params.customerId;
    if (!customerId) {
      return res.status(400).json({ msg: "Customer ID is required" });
    }
    const projects = await Project.find({ customer: customerId }).populate(
      "members",
      "name email",
    );
    res.json(projects);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch projects for customer" });
  }
};

module.exports = { getProjectsByCustomer };
