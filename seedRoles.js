/**
 * Run once to seed the three default system roles.
 * Usage:  node server/seedRoles.js
 */
const mongoose = require("mongoose");
require("dotenv").config({ path: __dirname + "/.env" });
const { Role } = require("./model/role");
const { connectToDb } = require("./database/db");

const defaultRoles = [
  {
    name: "Super Admin",
    isSystem: true,
    permissions: {
      dashboard: ["view"],
      employees: ["view", "create", "update", "delete"],
      projects: ["view", "create", "update", "delete"],
      attendance: ["view", "checkin", "checkout"],
      reports: ["view", "create"],
      logs: ["view"],
      employee_status: ["view"],
      profile: ["view", "update", "change_password"],
      roles: ["view", "create", "update", "delete"],
    },
  },
  {
    name: "Admin",
    isSystem: true,
    permissions: {
      dashboard: ["view"],
      employees: ["view"],
      projects: ["view", "update"],
      attendance: ["view", "checkin", "checkout"],
      reports: ["view", "create"],
      logs: ["view"],
      profile: ["view", "update", "change_password"],
    },
  },
  {
    name: "Employee",
    isSystem: true,
    permissions: {
      attendance: ["view", "checkin", "checkout"],
      profile: ["view", "update", "change_password"],
      my_projects: ["view", "update_status"],
    },
  },
];

async function seed() {
  await connectToDb();

  for (const r of defaultRoles) {
    const existing = await Role.findOne({ name: r.name });
    if (existing) {
      console.log(`⏩ Role "${r.name}" already exists – updating permissions`);
      existing.permissions = r.permissions;
      existing.isSystem = r.isSystem;
      await existing.save();
    } else {
      await Role.create(r);
      console.log(`✅ Created role "${r.name}"`);
    }
  }

  console.log("🎉 Role seeding complete");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
