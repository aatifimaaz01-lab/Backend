const Customer = require("../model/customer");
const Contact = require("../model/contact");

// Create a new customer with client contact and send set-password email
const { employee_Model } = require("../model/emp");
const sendMail = require("../utils/sendMail");
const crypto = require("crypto");

exports.createCustomer = async (req, res) => {
  try {
    const { name, email, phone, address, contact } = req.body;
    // 1. Create customer
    const customer = new Customer({ name, email, phone, address });
    await customer.save();

    // 2. Create contact
    const contactDoc = new Contact({
      customer: customer._id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      position: contact.position,
    });
    await contactDoc.save();

    // 3. Create client employee (for login)
    // Check if employee with this email already exists
    let existingEmp = await employee_Model.findOne({ email: contact.email });
    if (!existingEmp) {
      // Generate set-password token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = Date.now() + 1000 * 60 * 60 * 24; // 24h
      const emp = new employee_Model({
        name: contact.name,
        email: contact.email,
        phone_no: contact.phone || "",
        Department: "Client",
        Designation: "ClientContact",
        salary: "0",
        customer: customer._id,
        resetToken,
        resetTokenExpiry,
      });
      await emp.save();

      // 4. Send set-password email
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const setPasswordLink = `${frontendUrl}/set-password/${resetToken}`;
      await sendMail(
        contact.email,
        "Set your password for EmployeeMS",
        `<p>Hello ${contact.name},</p>
        <p>Your company (${name}) has been registered. Please set your password to activate your account:</p>
        <a href="${setPasswordLink}">${setPasswordLink}</a>
        <p>If you did not request this, please ignore this email.</p>`,
      );
    }

    res.status(201).json({ customer, contact: contactDoc });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all customers
exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single customer by ID
exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a customer
exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    res.json(customer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a customer
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    res.json({ message: "Customer deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add a contact to a customer
exports.addContact = async (req, res) => {
  try {
    const contact = new Contact({
      ...req.body,
      customer: req.params.customerId,
    });
    await contact.save();
    res.status(201).json(contact);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get contacts for a customer
exports.getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({ customer: req.params.customerId });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
