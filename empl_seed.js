const { connectToDb } = require("./database/db");
const { employee_Model } = require("./model/emp");

const userRegister = async () => {
  try {
    await connectToDb(); // ✅ wait for DB connection

    let newUser = new employee_Model({
      name: "aatif",
      email: "atfimaz@gmail.com",
      phone_no: 9482799475,
      Department: "IT",
      Designation: "Super Admin",
      salary: "50000",
      password: "123456", // ✅ required field
      skills: ["node", "react"],
    });

    await newUser.save(); // ✅ await save

    console.log("User saved successfully");
    process.exit();
  } catch (err) {
    console.log("Error:", err.message);
  }
};

userRegister();
