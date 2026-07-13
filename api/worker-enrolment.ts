import "./src/config/env.js"; // deve ser o primeiro import para aplicar overrides de mock
import { Worker } from "bullmq";
import {EnrolmentService} from "./src/services/EnrolmentService";
new Worker(
    "enrolment",
    async (job) => EnrolmentService.process(job.data.paymentId),
    {
        connection: { host: "127.0.0.1", port: 6379 },
        concurrency: 5,
    }
);

