const logger = require("./logger");

module.exports = function logAction({
  level = "info",
  message = "",
  userId = null,
  method = null,
  url = null,
  ip = null,
}) {
  try {
    if (!message) return; // prevent empty logs

    logger.log(level, message, {
      type: "action", // 👈 mark as business action
      userId,
      method,
      url,
      ip,
    });
  } catch (err) {
    logger.error("Action Logger Error", { message: err.message });
  }
};
