const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // permissions is a map of page/resource → array of allowed actions
    // e.g. { "employees": ["view", "create", "delete"], "projects": ["view"] }
    permissions: {
      type: Map,
      of: [String],
      default: {},
    },

    isSystem: {
      type: Boolean,
      default: false, // true for "Super Admin" – cannot be deleted/renamed
    },
  },
  { timestamps: true },
);

const Role = mongoose.models.roles || mongoose.model("roles", roleSchema);

module.exports = { Role };
