const { employee_Model } = require("../model/emp");
const logAction = require("./actionLogger");
const logger = require("./logger");

async function auditLog({
  req,
  action, // created / deleted / updated / viewed / assigned
  entity, // employee / project / report
  targetEmail = null,
  targetName = null,
}) {
  try {
    const actor = await employee_Model.findById(req.user?.id);

    if (!actor) return;

    let target = "";

    if (targetEmail) target = ` (${targetEmail})`;
    else if (targetName) target = ` (${targetName})`;

    const message = `${actor.Designation} (${actor.email}) ${action} ${entity}${target}`;

    logAction({
      message,
      userId: req.user.id,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });
  } catch (err) {
    // never crash system because of logging
    logger.error("Audit log failed", { message: err.message });
  }
}

module.exports = auditLog;
