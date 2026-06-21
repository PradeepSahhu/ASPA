import { ApiError } from "../utility/api.error.js";
import { ApiResponse } from "../utility/api.response.js";
import { API_CODE } from "../utility/constants/api.constants.js";
import prisma from "../utility/database/index.js";

const CreateNewTicket = async (req, res) => {
  const { header, description, bookId } = req.body;
  const author = req.author;

  if (!author) {
    return res
      .status(API_CODE.UNAUTHORIZED)
      .json(new ApiError(API_CODE.UNAUTHORIZED, "Unauthorized"));
  }

  if (!header || !description) {
    return res
      .status(API_CODE.BAD_REQUEST)
      .json(
        new ApiError(
          API_CODE.BAD_REQUEST,
          "Header and description are required",
        ),
      );
  }

  const newTicket = await prisma.ticket.create({
    data: {
      ...(bookId && { bookId }),
      authorId: author.id,
      header,
      detailDescription: description,
      status: "OPEN",
    },
  });

  const createdTicket = await prisma.ticket.findUnique({
    where: { id: newTicket.id },
  });

  if (!createdTicket) {
    return res
      .status(API_CODE.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(
          API_CODE.INTERNAL_SERVER_ERROR,
          "Something went wrong while creating the ticket",
        ),
      );
  }

  return res
    .status(API_CODE.ACCEPTED)
    .json(new ApiResponse(API_CODE.ACCEPTED, createdTicket, "success"));
};

const updateCategory = async (req, res) => {
  const { ticketId, category } = req.body;

  if (!ticketId || !category) {
    return res
      .status(API_CODE.BAD_REQUEST)
      .json(
        new ApiError(
          API_CODE.BAD_REQUEST,
          "ticketId and category are required",
        ),
      );
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    return res
      .status(API_CODE.NOT_FOUND)
      .json(new ApiError(API_CODE.NOT_FOUND, "Ticket not found"));
  }

  const updatedTicket = await prisma.ticket.update({
    where: { id: ticketId },
    data: { category },
  });

  return res
    .status(API_CODE.ACCEPTED)
    .json(new ApiResponse(API_CODE.ACCEPTED, updatedTicket, "success"));
};

const GetAuthorTickets = async (req, res) => {
  const author = req.author;

  if (!author) {
    return res
      .status(API_CODE.UNAUTHORIZED)
      .json(new ApiError(API_CODE.UNAUTHORIZED, "Unauthorized"));
  }

  const tickets = await prisma.ticket.findMany({
    where: { authorId: author.id },
    orderBy: { createdDate: "desc" },
    select: {
      id: true,
      header: true,
      status: true,
      category: true,
      createdDate: true,
    },
  });

  return res
    .status(API_CODE.ACCEPTED)
    .json(new ApiResponse(API_CODE.ACCEPTED, tickets, "success"));
};

const GetAllTickets = async (req, res) => {
  const admin = req.admin;

  if (!admin) {
    return res
      .status(API_CODE.UNAUTHORIZED)
      .json(new ApiError(API_CODE.UNAUTHORIZED, "Unauthorized"));
  }

  const tickets = await prisma.ticket.findMany({
    orderBy: { createdDate: "desc" },
    select: {
      id: true,
      header: true,
      status: true,
      category: true,
      createdDate: true,
      author: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return res
    .status(API_CODE.ACCEPTED)
    .json(new ApiResponse(API_CODE.ACCEPTED, tickets, "success"));
};

export { CreateNewTicket, updateCategory, GetAuthorTickets, GetAllTickets };
