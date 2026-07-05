const { Queue } = require("bullmq");
const Redis = require("ioredis");
require("dotenv").config();

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn("REDIS_URL is not set; report queue is disabled");
}

const connection = redisUrl
  ? new Redis(redisUrl, {
      maxRetriesPerRequest: null,
    })
  : null;

const reportQueue = connection
  ? new Queue("reportQueue", { connection })
  : {
      add: async () => {
        throw new Error("Report queue is disabled because REDIS_URL is not set");
      },
    };

module.exports = { reportQueue };
