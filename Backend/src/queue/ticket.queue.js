import { Queue } from "bullmq";
import { connection } from "./redis.js";

export const ticketQueue = new Queue("ticket-processing", { connection });
