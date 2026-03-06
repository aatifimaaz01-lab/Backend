const Transport = require("winston-transport");
const ApiLog = require("../model/apiLogModel");
const ErrorLog = require("../model/errorLogModel");
const CombinedLog = require("../model/combinedLogModel");

class MongoTransport extends Transport {
  async log(info, callback) {
    try {
      const timestamp = new Date();

      const {
        level = "info",
        message = "",
        method = null,
        url = null,
        status = null,
        userId = null,
        ip = null,
        stack = null,
      } = info;

      const type =
        level === "http" ? "api" : level === "error" ? "error" : "action";

      /* TIME SERIES INSERT */

      await CombinedLog.create({
        timestamp,
        meta: {
          type,
          level,
          message,
          method,
          url,
          status,
          userId,
          ip,
        },
      });

      /* API LOGS */

      if (type === "api") {
        await ApiLog.create({
          timestamp,
          meta: {
            method,
            url,
            status,
            message,
            userId,
            ip,
          },
        });
      }

      /* ERROR LOGS */

      if (type === "error") {
        await ErrorLog.create({
          timestamp,
          meta: {
            message,
            stack,
            url,
            method,
            userId,
            ip,
          },
        });
      }

      callback();
    } catch (err) {
      console.error("MongoTransport Error:", err);
      callback(err);
    }
  }
}

module.exports = MongoTransport;
