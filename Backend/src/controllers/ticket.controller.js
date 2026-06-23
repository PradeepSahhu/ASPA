import { ApiError } from "../utility/api.error.js";
import { ApiResponse } from "../utility/api.response.js";
import { API_CODE } from "../utility/constants/api.constants.js";
import {
  PRIORITY_LABELS,
  PRIORITY_SCORES,
} from "../utility/constants/priority.constants.js";
import { ticketQueue } from "../queue/ticket.queue.js";
import prisma from "../utility/database/index.js";

const CreateNewTicket = async (req, res) => {
  try {
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

    await ticketQueue.add(
      "categorize-ticket",
      { ticketId: createdTicket.id },
      { jobId: `categorize-ticket-${createdTicket.id}` },
    );

    await ticketQueue.add(
      "generate-draft",
      { ticketId: createdTicket.id },
      { jobId: `generate-draft-${createdTicket.id}` },
    );

    return res
      .status(API_CODE.ACCEPTED)
      .json(new ApiResponse(API_CODE.ACCEPTED, createdTicket, "success"));
  } catch (error) {
    console.error("Error creating ticket:", error);
    return res
      .status(API_CODE.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(
          API_CODE.INTERNAL_SERVER_ERROR,
          "Something went wrong while creating the ticket",
        ),
      );
  }
};

const updateCategory = async (req, res) => {
  try {
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
  } catch (error) {
    console.error("Error updating ticket category:", error);
    return res
      .status(API_CODE.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(
          API_CODE.INTERNAL_SERVER_ERROR,
          "Something went wrong while updating the ticket",
        ),
      );
  }
};

const GetAuthorTickets = async (req, res) => {
  try {
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
        priorityScore: true,
        createdDate: true,
      },
    });

    return res
      .status(API_CODE.ACCEPTED)
      .json(new ApiResponse(API_CODE.ACCEPTED, tickets, "success"));
  } catch (error) {
    console.error("Error fetching author tickets:", error);
    return res
      .status(API_CODE.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(
          API_CODE.INTERNAL_SERVER_ERROR,
          "Something went wrong while fetching tickets",
        ),
      );
  }
};

const GetAllTickets = async (req, res) => {
  try {
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
        priorityScore: true,
        createdDate: true,
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return res
      .status(API_CODE.ACCEPTED)
      .json(new ApiResponse(API_CODE.ACCEPTED, tickets, "success"));
  } catch (error) {
    console.error("Error fetching all tickets:", error);
    return res
      .status(API_CODE.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(
          API_CODE.INTERNAL_SERVER_ERROR,
          "Something went wrong while fetching tickets",
        ),
      );
  }
};

const OverridePriority = async (req, res) => {
  try {
    const admin = req.admin;
    const { ticketId, priorityScore } = req.body;

    if (!admin) {
      return res
        .status(API_CODE.UNAUTHORIZED)
        .json(new ApiError(API_CODE.UNAUTHORIZED, "Unauthorized"));
    }

    if (!ticketId || priorityScore === undefined) {
      return res
        .status(API_CODE.BAD_REQUEST)
        .json(
          new ApiError(
            API_CODE.BAD_REQUEST,
            "ticketId and priorityScore are required",
          ),
        );
    }

    if (!PRIORITY_SCORES.includes(priorityScore)) {
      return res
        .status(API_CODE.BAD_REQUEST)
        .json(
          new ApiError(
            API_CODE.BAD_REQUEST,
            `Priority score must be one of: ${PRIORITY_SCORES.join(", ")}`,
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
      data: { priorityScore },
      select: {
        id: true,
        header: true,
        category: true,
        priorityScore: true,
        status: true,
        updatedDate: true,
      },
    });

    return res
      .status(API_CODE.ACCEPTED)
      .json(
        new ApiResponse(
          API_CODE.ACCEPTED,
          updatedTicket,
          `Priority override to ${PRIORITY_LABELS[priorityScore]} completed`,
        ),
      );
  } catch (error) {
    console.error("Error overriding ticket priority:", error);
    return res
      .status(API_CODE.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(
          API_CODE.INTERNAL_SERVER_ERROR,
          "Something went wrong while overriding ticket priority",
        ),
      );
  }
};

const MarkTicketResolved = async (req, res) => {
  try {
    const { ticketId } = req.body;

    if (!ticketId) {
      return res
        .status(API_CODE.BAD_REQUEST)
        .json(new ApiError(API_CODE.BAD_REQUEST, "ticketId is required"));
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res
        .status(API_CODE.NOT_FOUND)
        .json(new ApiError(API_CODE.NOT_FOUND, "Ticket not found"));
    }

    // Author can resolve only their own tickets. Admin can resolve any ticket.
    if (req.author && ticket.authorId !== req.author.id) {
      return res
        .status(API_CODE.FORBIDDEN)
        .json(new ApiError(API_CODE.FORBIDDEN, "Forbidden"));
    }

    if (!req.author && !req.admin) {
      return res
        .status(API_CODE.UNAUTHORIZED)
        .json(new ApiError(API_CODE.UNAUTHORIZED, "Unauthorized"));
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: "RESOLVED",
        resolvedDate: new Date(),
      },
      select: {
        id: true,
        status: true,
        resolvedDate: true,
        updatedDate: true,
      },
    });

    return res
      .status(API_CODE.ACCEPTED)
      .json(
        new ApiResponse(
          API_CODE.ACCEPTED,
          updatedTicket,
          "Ticket marked as resolved",
        ),
      );
  } catch (error) {
    console.error("Error marking ticket resolved:", error);
    return res
      .status(API_CODE.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(
          API_CODE.INTERNAL_SERVER_ERROR,
          "Something went wrong while resolving ticket",
        ),
      );
  }
};

const UnresolveTicket = async (req, res) => {
  try {
    const { ticketId } = req.body;

    if (!ticketId) {
      return res
        .status(API_CODE.BAD_REQUEST)
        .json(new ApiError(API_CODE.BAD_REQUEST, "ticketId is required"));
    }

    if (!req.admin) {
      return res
        .status(API_CODE.FORBIDDEN)
        .json(new ApiError(API_CODE.FORBIDDEN, "Only admin can unresolve"));
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res
        .status(API_CODE.NOT_FOUND)
        .json(new ApiError(API_CODE.NOT_FOUND, "Ticket not found"));
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: "OPEN",
        resolvedDate: null,
      },
      select: {
        id: true,
        status: true,
        resolvedDate: true,
        updatedDate: true,
      },
    });

    return res
      .status(API_CODE.ACCEPTED)
      .json(
        new ApiResponse(
          API_CODE.ACCEPTED,
          updatedTicket,
          "Ticket marked as open",
        ),
      );
  } catch (error) {
    console.error("Error unresolving ticket:", error);
    return res
      .status(API_CODE.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(
          API_CODE.INTERNAL_SERVER_ERROR,
          "Something went wrong while unresolving ticket",
        ),
      );
  }
};

const GetTicketDetail = async (req, res) => {
  try {
    const { ticketId } = req.params;

    if (!ticketId) {
      return res
        .status(API_CODE.BAD_REQUEST)
        .json(new ApiError(API_CODE.BAD_REQUEST, "ticketId is required"));
    }

    const ticketSelect = {
      id: true,
      header: true,
      detailDescription: true,
      status: true,
      category: true,
      priorityScore: true,
      createdDate: true,
      updatedDate: true,
      author: {
        select: { id: true, name: true, email: true },
      },
    };

    if (req.admin) {
      ticketSelect.aiDraft = true;
      ticketSelect.notes = {
        where: { visibility: "ADMIN" },
        select: {
          id: true,
          message: true,
          visibility: true,
          adminId: true,
          admin: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { id: "desc" },
      };
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: ticketSelect,
    });

    if (!ticket) {
      return res
        .status(API_CODE.NOT_FOUND)
        .json(new ApiError(API_CODE.NOT_FOUND, "Ticket not found"));
    }

    return res
      .status(API_CODE.ACCEPTED)
      .json(new ApiResponse(API_CODE.ACCEPTED, ticket, "success"));
  } catch (error) {
    console.error("Error fetching ticket detail:", error);
    return res
      .status(API_CODE.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(
          API_CODE.INTERNAL_SERVER_ERROR,
          "Something went wrong while fetching ticket detail",
        ),
      );
  }
};

export {
  CreateNewTicket,
  updateCategory,
  GetAuthorTickets,
  GetAllTickets,
  OverridePriority,
  MarkTicketResolved,
  UnresolveTicket,
  GetTicketDetail,
};
