import express from "express";
import basicAuth from "express-basic-auth";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { notificationQueue, eventQueue } from "./src/queues/index.js";

const app = express();
app.use(
  "/bull",
  basicAuth({
    users: {
      admin:
      process.env.BULL_PASSWORD
     },
    challenge: true,
  })
);

// ----------------------
// Bull Board
// ----------------------
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/bull");

createBullBoard({
  queues: [
    new BullMQAdapter(notificationQueue),
    new BullMQAdapter(eventQueue),
  ],
  serverAdapter,
});
app.use("/bull", serverAdapter.getRouter());
const PORT = process.env.BULL_DASHBOARD_PORT || 9001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`📊 Bull Board a correr em http://0.0.0.0:${PORT}/bull`);
});
