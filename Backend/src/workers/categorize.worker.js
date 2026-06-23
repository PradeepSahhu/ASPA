import { Worker } from "bullmq";
import { connection } from "../queue/redis.js";
import prisma from "../utility/database/index.js";
import { callLLM } from "../llm/lllm.js";
import { CLASSIFICATION_AND_PRIORITY_SCORE } from "../llm/Prompts/classificationAndPriorityScore.prompt.js";

const worker = new Worker(
  "ticket-processing",

  async (job) => {
    console.log("📋 Processing ticket", job.data.ticketId);
    try {
      const ticketId = job.data.ticketId;

      if (!ticketId) {
        console.error("No ticketId provided");
        throw new Error("Missing ticketId");
      }

      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: {
          id: true,
          header: true,
          detailDescription: true,
          priorityScore: true,
        },
      });

      if (!ticket) {
        console.error(" Ticket not found:", ticketId);
        throw new Error(`Ticket not found: ${ticketId}`);
      }

      console.log("✅ Ticket found:", ticket.id);
      console.log("📝 Processing content...");
      console.log(`   Header: ${ticket.header}`);
      console.log(
        `   Description: ${ticket.detailDescription.substring(0, 100)}...`,
      );

      const userPrompt = `TICKET TO PROCESS:
Ticket ID: "${ticket.id}"
Header: "${ticket.header}"
Description: "${ticket.detailDescription}"

Please assign a priority score and also the Category for this ticket and update it in DB using the tools.`;

      console.log("🤖 Calling LLM for priority analysis...");
      const llmResult = await callLLM({
        systemPrompt: CLASSIFICATION_AND_PRIORITY_SCORE,
        userPrompt,
      });
      console.log("✅ LLM Processing completed");
      console.log(`🎯 Result: ${llmResult}`);

      // Fetch updated ticket to confirm changes
      const updatedTicket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: {
          id: true,
          header: true,
          priorityScore: true,
          status: true,
          updatedDate: true,
        },
      });

      console.log("✅ Final ticket state:");
      console.table(updatedTicket);

      return {
        success: true,
        ticketId,
        priorityScore: updatedTicket.priorityScore,
        message: "Ticket prioritized successfully",
      };
    } catch (error) {
      console.error("❌ Error processing ticket:", error.message);
      throw error;
    }
  },
  { connection },
);

worker.on("ready", () => console.log("✅ Worker ready and listening..."));
worker.on("error", (err) => console.error("❌ Worker error:", err));
worker.on("failed", (job, err) =>
  console.error("❌ Job failed:", job.id, err.message),
);
worker.on("completed", (job) => console.log("✅ Job completed:", job.id));

console.log("✅ Worker started and listening for categorize-ticket jobs...");
