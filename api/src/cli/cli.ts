#!/usr/bin/env node
import { Command } from "commander";
import {updatePendingOrders} from "../schedules/tasks/updatePendingOrders.ts";
import {abandonedRemember} from "../schedules/tasks/abandonedRemember.ts";
import {sendDayResume} from "../schedules/tasks/sendDayResume.ts";
const program = new Command();
program
    .name("app")
    .description("CLI de schedules")
    .version("1.0.0");

/**
 * updatePendingOrders
 */
program
    .command("order:update-pending")
    .description("Executa o job updatePendingOrders")
    .action(async () => {
        await updatePendingOrders();
        process.exit(0);
    });

/**
 * abandonedRemember
 */
program
    .command("order:abandoned-remember")
    .description("Executa o job abandonedRemember")
    .action(async () => {
        await abandonedRemember();
        process.exit(0);
    });

/**
 * sendDayResume
 */
program
    .command("resume:send-day")
    .description("Executa o job sendDayResume")
    .action(async () => {
        await sendDayResume();
        process.exit(0);
    });

program.parse();
