const { Queue } = require("bullmq");
const Redis = require("ioredis");

const connection = new Redis({
  maxRetriesPerRequest: null,
});

const reportQueue = new Queue("reportQueue", { connection });

module.exports = { reportQueue };
