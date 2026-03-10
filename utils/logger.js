const winston = require("winston");
const MongoTransport = require("./dbTransport");

const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
};

const httpFilter = winston.format((info) =>
  info.level === "http" ? info : false,
);

const excludeHttp = winston.format((info) =>
  info.level !== "http" ? info : false,
);

const logger = winston.createLogger({
  levels: customLevels.levels,

  level: "debug",

  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),

  transports: [
    /**
     * ❌ ERROR FILE
     */
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5 * 1024 * 1024, // 5 MB per file
      maxFiles: 5,
    }),

    /**
     * 📁 COMBINED FILE (no http)
     */
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 10 * 1024 * 1024, // 10 MB per file
      maxFiles: 5,
      format: winston.format.combine(
        excludeHttp(),
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),

    /**
     * 🌐 REQUESTS FILE (only http)
     */
    new winston.transports.File({
      filename: "logs/requests.log",
      maxsize: 10 * 1024 * 1024, // 10 MB per file
      maxFiles: 5,
      format: winston.format.combine(
        httpFilter(),
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),

    /**
     * 🗄 MongoDB Transport
     */
    new MongoTransport(),
  ],
});

module.exports = logger;
