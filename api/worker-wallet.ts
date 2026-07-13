import { Worker } from "bullmq";
import { PaymentService } from "./src/services/PaymentService";

new Worker(
    "wallet-payments",
    async (job) => PaymentService.processWallet(job.data.paymentCode),
    {
        connection: { host: "127.0.0.1", port: 6379 },
        concurrency: 5,
    }
);
