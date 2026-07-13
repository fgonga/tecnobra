import { Queue } from "bullmq";
import { config } from "../config/env";

const redisConnection = config.redis;

export const successQueue  = new Queue("payments-success", { connection: redisConnection });
export const failedQueue   = new Queue("payments-failed",  { connection: redisConnection });
export const notificationQueue = new Queue("notification", { connection: redisConnection });
export const enrolmentQueue = new Queue("enrolment",       { connection: redisConnection });
export const eventQueue    = new Queue("system-events",    { connection: redisConnection });
export const walletQueue   = new Queue("wallet-payments",  { connection: redisConnection });