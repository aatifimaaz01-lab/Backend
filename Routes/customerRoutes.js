const express = require("express");
const router = express.Router();
const customerController = require("../controller/customerController");
const {
  getProjectsByCustomer,
} = require("../controller/customerProjectController");

// Customer routes
router.post("/", customerController.createCustomer);
router.get("/", customerController.getCustomers);
router.get("/:id", customerController.getCustomer);
router.put("/:id", customerController.updateCustomer);
router.delete("/:id", customerController.deleteCustomer);

// Contact routes for a customer
router.post("/:customerId/contacts", customerController.addContact);
router.get("/:customerId/contacts", customerController.getContacts);

// Projects for a customer
router.get("/:customerId/projects", getProjectsByCustomer);

module.exports = router;
