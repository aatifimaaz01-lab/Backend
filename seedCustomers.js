const mongoose = require("mongoose");
const Customer = require("./model/customer");
require("dotenv").config();

async function seedCustomers() {
  await mongoose.connect(
    process.env.MONGO_URL || "mongodb://localhost:27017/yourdbname",
  );

  const customers = [
    {
      name: "Acme Corp",
      address: "123 Main St, Springfield",
      email: "info@acme.com",
      phone: "555-1234",
    },
    {
      name: "Globex Inc",
      address: "456 Elm St, Metropolis",
      email: "contact@globex.com",
      phone: "555-5678",
    },
    {
      name: "Initech",
      address: "789 Oak St, Gotham",
      email: "hello@initech.com",
      phone: "555-9012",
    },
  ];

  await Customer.deleteMany({});
  await Customer.insertMany(customers);
  console.log("Seeded customers!");
  mongoose.disconnect();
}

seedCustomers().catch((err) => {
  console.error(err);
  mongoose.disconnect();
});
