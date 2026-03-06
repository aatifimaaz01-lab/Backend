const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employees",
      required: true,
    },

    sessions: [
      {
        checkIn: Date,
        checkOut: Date,
        duration: Number, // in minutes
      },
    ],

    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },

    totalMinutes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Attendance", attendanceSchema);
