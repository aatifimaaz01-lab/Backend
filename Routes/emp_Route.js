let express = require("express");
const upload = require("../middleware/upload");

const {
  view_employees,
  insert_employees,
  delete_employees,
  update_employees,
  view_single_employee,
  departmentStats,
  // setPassword,
} = require("../controller/empcontroller");

const verifyUser = require("../middleware/verifyuser");
const allowRoles = require("../middleware/roleCheck");

let route = express.Router();

/* 👔 Admin + Super Admin */
route.get(
  "/view",
  verifyUser,
  allowRoles("Employee", "Admin", "Super Admin"),
  view_employees,
);

/* 👑 Super Admin only */

route.post(
  "/insert",
  verifyUser,
  allowRoles("Super Admin"),
  upload.fields([
    { name: "profilePic", maxCount: 1 },
    { name: "documents", maxCount: 5 },
  ]),
  insert_employees,
);

route.delete(
  "/delete/:id",
  verifyUser,
  allowRoles("Super Admin"),
  delete_employees,
);

route.put(
  "/update/:id",
  verifyUser,
  allowRoles("Super Admin"),
  upload.fields([
    { name: "profilePic", maxCount: 1 },
    { name: "documents", maxCount: 5 },
  ]),
  update_employees,
);

route.get(
  "/departments",
  verifyUser,
  allowRoles("Admin", "Super Admin"),
  departmentStats,
);

/* 👤 Any logged-in user can view their own details */
route.get("/getSingle/:id", verifyUser, view_single_employee);

// route.post("/set-password/:token", setPassword);

module.exports = route;
