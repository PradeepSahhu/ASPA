import { Worker } from "bullmq";
import { connection } from "../queue/redis.js";
import prisma from "../utility/database/index.js";
import { callLLM } from "../llm/lllm.js";
import { LlmInvoke } from "../llm/lllm.js";
import { ROLE } from "../utility/constants/role.constants.js";
import { CLASSIFICATION_AND_PRIORITY_SCORE } from "../llm/Prompts/classificationAndPriorityScore.prompt.js";
import { GENERATE_DRAFT_PROMPT } from "../llm/Prompts/generateDraft.prompt.js";
import { BUSINESS_PROMPT } from "../llm/Prompts/generalInquiry.prompt.js";
import {
  buildCategorizeTicketPrompt,
  buildDraftResponsePrompt,
} from "../llm/Prompts/ticketUserPrompt.builder.js";

const worker = new Worker(
  "ticket-processing",

  async (job) => {
    if (job.name === "llm-chat") {
      const { prompt, authorId, ticketId } = job.data || {};

      if (!prompt) {
        throw new Error("Missing prompt for llm-chat job");
      }

      if (!ticketId) {
        throw new Error("Missing ticketId for llm-chat job");
      }

      const llmResult = await LlmInvoke(prompt, authorId);

      const normalizedMessage =
        typeof llmResult === "string" ? llmResult : JSON.stringify(llmResult);

      const savedMessage = await prisma.ticketMessage.create({
        data: {
          ticketId,
          responseActor: ROLE.LLM,
          message: normalizedMessage,
        },
      });

      return {
        success: true,
        type: "llm-chat",
        ticketId,
        messageId: savedMessage.id,
      };
    }

    if (job.name === "generate-draft") {
      const { ticketId } = job.data || {};

      if (!ticketId) {
        throw new Error("Missing ticketId for generate-draft job");
      }

      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: {
          id: true,
          header: true,
          detailDescription: true,
          authorId: true,
          category: true,
        },
      });

      if (!ticket) {
        throw new Error(`Ticket not found: ${ticketId}`);
      }

      const userPrompt = buildDraftResponsePrompt(ticket);
      const isGeneralInquiry = (ticket.category || "")
        .toLowerCase()
        .includes("general");

      const draftResponse = await callLLM({
        systemPrompt: isGeneralInquiry
          ? BUSINESS_PROMPT
          : GENERATE_DRAFT_PROMPT,
        userPrompt,
      });

      const normalizedDraft =
        typeof draftResponse === "string"
          ? draftResponse
          : JSON.stringify(draftResponse);

      const updatedTicket = await prisma.ticket.update({
        where: { id: ticketId },
        data: { aiDraft: normalizedDraft },
        select: {
          id: true,
          header: true,
          aiDraft: true,
        },
      });

      return {
        success: true,
        type: "generate-draft",
        ticketId,
        draftGenerated: true,
      };
    }

    if (job.name !== "categorize-ticket") {
      return { success: false, skipped: true, jobName: job.name };
    }

    const ticketId = job.data.ticketId;

    if (!ticketId) {
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
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    const userPrompt = buildCategorizeTicketPrompt(ticket);

    await callLLM({
      systemPrompt: CLASSIFICATION_AND_PRIORITY_SCORE,
      userPrompt,
    });

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

    return {
      success: true,
      type: "categorize-ticket",
      ticketId,
      priorityScore: updatedTicket.priorityScore,
      message: "Ticket prioritized successfully",
    };
  },
  {
    connection,
    concurrency: 1,
    settings: {
      lockDuration: 1000,
      lockRenewTime: 500,
      maxStalledCount: 2,
      stalledInterval: 300,
      retryProcessDelay: 100,
    },
  },
);

process.on("SIGINT", async () => {
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});
