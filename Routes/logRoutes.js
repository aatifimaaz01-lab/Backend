const express = require("express");
const router = express.Router();
const CombinedLog = require("../model/combinedLogModel");
const verifyUser = require("../middleware/verifyuser");
const checkPermission = require("../middleware/checkPermission");

router.get(
  "/",
  verifyUser,
  checkPermission("logs", "view"),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 30,
        search,
        type,
        startDate,
        endDate,
      } = req.query;

      const query = {};

      /* TYPE FILTER */

      if (type && type !== "") {
        query["meta.type"] = type;
      }

      /* SEARCH FILTER */

      if (search && search !== "") {
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        query["meta.message"] = {
          $regex: escaped,
          $options: "i",
        };
      }

      /* DATE FILTER */

      if (startDate || endDate) {
        query.timestamp = {};

        if (startDate) {
          query.timestamp.$gte = new Date(startDate);
        }

        if (endDate) {
          query.timestamp.$lte = new Date(endDate);
        }
      }

      const skip = (page - 1) * limit;

      const logs = await CombinedLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await CombinedLog.countDocuments(query);

      res.json({
        logs,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  },
);

module.exports = router;
