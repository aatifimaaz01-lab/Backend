const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  name: { type: String, required: true },
  email: String,
  phone: String,
  position: String,
});

module.exports = mongoose.model("Contact", contactSchema);
