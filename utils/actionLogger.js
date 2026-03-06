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
    console.error("Action Logger Error:", err);
  }
};
