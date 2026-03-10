let express = require("express");
const { connectToDb } = require("./database/db");
const route = require("./Routes/emp_Route");
const authroute = require("./Routes/auth_Route");
const projroute = require("./Routes/projectRoutes");
const reportRoutes = require("./Routes/reportRoutes");
const attendanceRoutes = require("./Routes/attendanceRoutes");
const morgan = require("morgan");
const logger = require("./utils/logger");
const logRoutes = require("./Routes/logRoutes");
const roleRoutes = require("./Routes/roleRoutes");
const dashboardRoutes = require("./Routes/dashboardRoutes");
const { router: attendanceStream } = require("./Routes/attendanceStream");

const cors = require("cors");
const errorHandler = require("./middleware/errorHandler");
let app = express();
require("dotenv").config();

connectToDb();

app.use(express.json());
app.use((req, res, next) => {
  // Skip logging for OPTIONS preflight and log endpoint itself
  if (req.method === "OPTIONS" || req.originalUrl.startsWith("/api/logs")) {
    return next();
  }

  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    logger.http("API Request", {
      type: "api",
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      ip: req.ip,
      responseTime: duration,
    });
  });

  next();
});
app.use(cors());

app.use("/api/employees", route);
app.use("/api/auth", authroute);
app.use("/api/projects", projroute);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/attendance", attendanceStream);
app.use("/api/reports", reportRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/logs", logRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(errorHandler);

app.listen(5200, () => {
  logger.info(`Server running on port ${process.env.PORT}`);
  console.log(`🚀 Server running on port ${process.env.PORT}`);
});
