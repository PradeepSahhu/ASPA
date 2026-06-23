import { ApiError } from "../utility/api.error.js";
import { ApiResponse } from "../utility/api.response.js";
import { API_CODE } from "../utility/constants/api.constants.js";
import prisma from "../utility/database/index.js";
import { ticketQueue } from "../queue/ticket.queue.js";

export const llmTest = async (req, res) => {
  const { ticketId, prompt } = req.body;

  if (!ticketId || !prompt) {
    return res
      .status(API_CODE.BAD_REQUEST)
      .json(
        new ApiError(
          API_CODE.BAD_REQUEST,
          "ticketId and prompt are required",
          "Failed",
        ),
      );
  }

  try {
    // Get ticket and author ID
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { authorId: true },
    });

    if (!ticket) {
      return res
        .status(API_CODE.NOT_FOUND)
        .json(new ApiError(API_CODE.NOT_FOUND, "Ticket not found", "Failed"));
    }

    const authorId = ticket.authorId;

    // Queue the LLM job in the existing ticket queue
    const job = await ticketQueue.add("llm-chat", {
      prompt,
      authorId,
      ticketId,
    });

    console.log(
      `📤 Job QUEUED: ${job?.id} llm-chat (pending: ${await ticketQueue.getWaitingCount()})`,
    );

    if (!job || !job.id) {
      return res
        .status(API_CODE.INTERNAL_SERVER_ERROR)
        .json(
          new ApiError(
            API_CODE.INTERNAL_SERVER_ERROR,
            "Failed to queue LLM processing",
            "Failed",
          ),
        );
    }

    return res
      .status(API_CODE.ACCEPTED)
      .json(
        new ApiResponse(
          API_CODE.ACCEPTED,
          { jobId: job.id, message: "LLM processing queued" },
          "Success",
        ),
      );
  } catch (error) {
    return res
      .status(API_CODE.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(
          API_CODE.INTERNAL_SERVER_ERROR,
          error.message || "Internal server error",
          "Failed",
        ),
      );
  }
};
