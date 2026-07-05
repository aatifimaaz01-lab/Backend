const { Queue } = require("bullmq");
const Redis = require("ioredis");
require("dotenv").config();

const connection = new Redis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null,
  },
);

const reportQueue = new Queue("reportQueue", { connection });

module.exports = { reportQueue };
