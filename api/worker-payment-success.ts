import { Worker } from "bullmq";
import {PaymentService} from "./src/services/PaymentService";

new Worker(
    "payments-success",
    async (job) => await PaymentService.process(job.data),
    {
        connection: { host: "127.0.0.1", port: 6379 },
        concurrency: 5,
    }
);

