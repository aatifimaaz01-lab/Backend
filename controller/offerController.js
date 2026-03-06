const PDFDocument = require("pdfkit");
const { employee_Model } = require("../model/emp");
const logAction = require("../utils/actionLogger");
const logger = require("../utils/logger");

const generateOfferLetter = async (req, res) => {
  try {
    const userId = req.params.id;

    const employee = await employee_Model.findById(userId);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=OfferLetter-${employee.name}.pdf`,
    );

    doc.pipe(res);

    /* ---------- CONTENT ---------- */

    doc.fontSize(20).text("OFFER LETTER", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    doc.text(`Dear ${employee.name},`);
    doc.moveDown();

    doc.text(
      `We are pleased to offer you the position of ${employee.Designation} in the ${employee.Department} department at our organization.`,
    );

    doc.moveDown();

    doc.text(`Your annual compensation will be $${employee.salary}.`);
    doc.moveDown();

    doc.text(
      `We look forward to your valuable contribution and welcome you to our team.`,
    );

    doc.moveDown();
    doc.text("Sincerely,");
    doc.text("HR Department");

    doc.end();

    // 🔹 LOG SUCCESS (without sensitive salary info)
    logAction({
      message: "Generated offer letter",
      userId: req.user?.id,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });
  } catch (err) {
    logger.error("Offer letter generation failed", {
      type: "error",
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.status(500).json({
      message: "Offer letter generation failed",
    });
  }
};

module.exports = { generateOfferLetter };
