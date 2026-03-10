let express = require("express");
const upload = require("../middleware/upload");

const {
  view_employees,
  insert_employees,
  delete_employees,
  update_employees,
  view_single_employee,
  departmentStats,
  checkEmail,
  // setPassword,
} = require("../controller/empcontroller");

const verifyUser = require("../middleware/verifyuser");
const checkPermission = require("../middleware/checkPermission");

let route = express.Router();

/* 👔 Any role with employees.view */
route.get(
  "/view",
  verifyUser,
  checkPermission("employees", "view"),
  view_employees,
);

/* 👑 employees.create */
route.post(
  "/insert",
  verifyUser,
  checkPermission("employees", "create"),
  upload.fields([
    { name: "profilePic", maxCount: 1 },
    { name: "documents", maxCount: 5 },
  ]),
  insert_employees,
);

route.delete(
  "/delete/:id",
  verifyUser,
  checkPermission("employees", "delete"),
  delete_employees,
);

route.put(
  "/update/:id",
  verifyUser,
  checkPermission("employees", "update"),
  upload.fields([
    { name: "profilePic", maxCount: 1 },
    { name: "documents", maxCount: 5 },
  ]),
  update_employees,
);

route.get(
  "/departments",
  verifyUser,
  checkPermission("dashboard", "view"),
  departmentStats,
);

/* 👤 Any logged-in user can view their own details */
route.get("/getSingle/:id", verifyUser, view_single_employee);

/* 📧 Check if email already exists */
route.get("/check-email", verifyUser, checkEmail);

// route.post("/set-password/:token", setPassword);

module.exports = route;
