import { ApiError } from "../utility/api.error.js";
import { ApiResponse } from "../utility/api.response.js";
import { API_CODE } from "../utility/constants/api.constants.js";
import { ROLE } from "../utility/constants/role.constants.js";
import prisma from "../utility/database/index.js";

const createNewMessage = async (req, res) => {
  const { conversationId: ticketId } = req.params;
  const { message } = req.body;

  if (!ticketId || !message) {
    return res
      .status(API_CODE.BAD_REQUEST)
      .json(
        new ApiError(API_CODE.BAD_REQUEST, "ticketId and message are required"),
      );
  }

  // derive the actor from the authenticated user, not from req.body
  let responseActor;
  if (req.admin) responseActor = ROLE.ADMIN;
  else if (req.author) responseActor = ROLE.AUTHOR;
  else {
    return res
      .status(API_CODE.UNAUTHORIZED)
      .json(new ApiError(API_CODE.UNAUTHORIZED, "Unauthorized"));
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    return res
      .status(API_CODE.NOT_FOUND)
      .json(new ApiError(API_CODE.NOT_FOUND, "Ticket not found"));
  }

  const newMessage = await prisma.ticketMessage.create({
    data: {
      ticketId,
      message,
      responseActor,
    },
  });

  return res
    .status(API_CODE.ACCEPTED)
    .json(new ApiResponse(API_CODE.ACCEPTED, newMessage, "success"));
};

const GetConversationMessages = async (req, res) => {
  const { conversationId: ticketId } = req.params;

  if (!ticketId) {
    return res
      .status(API_CODE.BAD_REQUEST)
      .json(new ApiError(API_CODE.BAD_REQUEST, "ticketId are required"));
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    return res
      .status(API_CODE.NOT_FOUND)
      .json(new ApiError(API_CODE.NOT_FOUND, "Ticket not found"));
  }

  const ticketMessages = await prisma.ticketMessage.findMany({
    where: { ticketId },
    orderBy: { createdAt: "asc" },
  });

  return res
    .status(API_CODE.ACCEPTED)
    .json(new ApiResponse(API_CODE.ACCEPTED, ticketMessages, "success"));
};

export { createNewMessage, GetConversationMessages };
