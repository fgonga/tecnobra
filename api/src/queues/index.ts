import { Queue } from "bullmq";
import { config } from "../config/env";

const redisConnection = config.redis;

export const notificationQueue = new Queue("notification",  { connection: redisConnection });
export const eventQueue        = new Queue("system-events", { connection: redisConnection });
