const { Role } = require("../model/role");
const { AVAILABLE_PERMISSIONS } = require("../controller/roleController");

/**
 * Dynamic RBAC middleware.
 * Usage: checkPermission("employees", "create")
 *
 * Super Admin always passes.
 * For other roles, it looks up the Role document in DB and checks
 * if the role has the required page+action permission.
 */
const checkPermission = (page, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, message: "Not authenticated" });
      }

      const userRole = req.user.role;

      // Super Admin bypasses all permission checks
      if (userRole === "Super Admin") {
        return next();
      }

      // Look up the role's permissions from DB
      const role = await Role.findOne({ name: userRole }).lean();

      if (!role) {
        return res
          .status(403)
          .json({ success: false, message: "Access denied – role not found" });
      }

      const pagePermissions =
        role.permissions instanceof Map
          ? role.permissions.get(page)
          : role.permissions[page];

      if (!pagePermissions || !pagePermissions.includes(action)) {
        return res.status(403).json({
          success: false,
          message: `Access denied – missing permission: ${page}.${action}`,
        });
      }

      next();
    } catch (err) {
      return res
        .status(500)
        .json({ success: false, message: "Permission check failed" });
    }
  };
};

module.exports = checkPermission;
