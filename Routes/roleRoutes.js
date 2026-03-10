const express = require("express");
const router = express.Router();
const verifyUser = require("../middleware/verifyuser");
const checkPermission = require("../middleware/checkPermission");

const {
  createRole,
  getRoles,
  getRole,
  updateRole,
  deleteRole,
  getPermissionSchema,
  getMyPermissions,
} = require("../controller/roleController");

// Any authenticated user can fetch their own permissions
router.get("/my-permissions", verifyUser, getMyPermissions);

// Permission schema (what pages/actions exist)
router.get(
  "/schema",
  verifyUser,
  checkPermission("roles", "view"),
  getPermissionSchema,
);

// CRUD – roles permission required
router.get("/", verifyUser, checkPermission("roles", "view"), getRoles);
router.get("/:id", verifyUser, checkPermission("roles", "view"), getRole);
router.post("/", verifyUser, checkPermission("roles", "create"), createRole);
router.put("/:id", verifyUser, checkPermission("roles", "update"), updateRole);
router.delete(
  "/:id",
  verifyUser,
  checkPermission("roles", "delete"),
  deleteRole,
);

module.exports = router;
