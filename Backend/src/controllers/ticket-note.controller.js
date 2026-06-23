import { ApiError } from "../utility/api.error.js";
import { ApiResponse } from "../utility/api.response.js";
import { API_CODE } from "../utility/constants/api.constants.js";
import prisma from "../utility/database/index.js";

const NOTE_VISIBILITY = {
  ALL_ADMINS: "ADMIN",
  PRIVATE: "PRIVATE",
};

const isValidVisibility = (visibility) =>
  Object.values(NOTE_VISIBILITY).includes(visibility);

const CreateTicketNote = async (req, res) => {
  try {
    const admin = req.admin;
    const { ticketId, message, visibility = "ADMIN" } = req.body;

    if (!admin) {
      return res
        .status(API_CODE.UNAUTHORIZED)
        .json(new ApiError(API_CODE.UNAUTHORIZED, "Unauthorized"));
    }

    if (!ticketId || !message?.trim()) {
      return res
        .status(API_CODE.BAD_REQUEST)
        .json(
          new ApiError(
            API_CODE.BAD_REQUEST,
            "ticketId and message are required",
          ),
        );
    }

    if (!isValidVisibility(visibility)) {
      return res
        .status(API_CODE.BAD_REQUEST)
        .json(
          new ApiError(
            API_CODE.BAD_REQUEST,
            "visibility must be either ADMIN or PRIVATE",
          ),
        );
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res
        .status(API_CODE.NOT_FOUND)
        .json(new ApiError(API_CODE.NOT_FOUND, "Ticket not found"));
    }

    const note = await prisma.ticketNote.create({
      data: {
        ticketId,
        adminId: admin.id,
        message: message.trim(),
        visibility,
      },
      select: {
        id: true,
        ticketId: true,
        adminId: true,
        message: true,
        visibility: true,
        admin: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return res
      .status(API_CODE.ACCEPTED)
      .json(new ApiResponse(API_CODE.ACCEPTED, note, "Note created"));
  } catch (error) {
    console.error("Error creating ticket note:", error);
    return res
      .status(API_CODE.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(
          API_CODE.INTERNAL_SERVER_ERROR,
          "Something went wrong while creating note",
        ),
      );
  }
};

const GetTicketNotes = async (req, res) => {
  try {
    const admin = req.admin;
    const { ticketId } = req.params;

    if (!admin) {
      return res
        .status(API_CODE.UNAUTHORIZED)
        .json(new ApiError(API_CODE.UNAUTHORIZED, "Unauthorized"));
    }

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

    const notes = await prisma.ticketNote.findMany({
      where: {
        ticketId,
        OR: [
          { visibility: NOTE_VISIBILITY.ALL_ADMINS },
          { visibility: NOTE_VISIBILITY.PRIVATE, adminId: admin.id },
        ],
      },
      select: {
        id: true,
        ticketId: true,
        adminId: true,
        message: true,
        visibility: true,
        admin: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { id: "desc" },
    });

    return res
      .status(API_CODE.ACCEPTED)
      .json(new ApiResponse(API_CODE.ACCEPTED, notes, "success"));
  } catch (error) {
    console.error("Error fetching ticket notes:", error);
    return res
      .status(API_CODE.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(
          API_CODE.INTERNAL_SERVER_ERROR,
          "Something went wrong while fetching notes",
        ),
      );
  }
};

const UpdateTicketNote = async (req, res) => {
  try {
    const admin = req.admin;
    const { noteId } = req.params;
    const { message, visibility } = req.body;

    if (!admin) {
      return res
        .status(API_CODE.UNAUTHORIZED)
        .json(new ApiError(API_CODE.UNAUTHORIZED, "Unauthorized"));
    }

    if (!noteId || !message?.trim()) {
      return res
        .status(API_CODE.BAD_REQUEST)
        .json(
          new ApiError(API_CODE.BAD_REQUEST, "noteId and message are required"),
        );
    }

    const note = await prisma.ticketNote.findUnique({ where: { id: noteId } });
    if (!note) {
      return res
        .status(API_CODE.NOT_FOUND)
        .json(new ApiError(API_CODE.NOT_FOUND, "Note not found"));
    }

    if (visibility !== undefined && !isValidVisibility(visibility)) {
      return res
        .status(API_CODE.BAD_REQUEST)
        .json(
          new ApiError(
            API_CODE.BAD_REQUEST,
            "visibility must be either ADMIN or PRIVATE",
          ),
        );
    }

    if (
      note.visibility === NOTE_VISIBILITY.PRIVATE &&
      note.adminId !== admin.id
    ) {
      return res
        .status(API_CODE.FORBIDDEN)
        .json(
          new ApiError(
            API_CODE.FORBIDDEN,
            "Only the note owner can edit this private note",
          ),
        );
    }

    const updatedNote = await prisma.ticketNote.update({
      where: { id: noteId },
      data: {
        message: message.trim(),
        ...(visibility !== undefined ? { visibility } : {}),
      },
      select: {
        id: true,
        ticketId: true,
        adminId: true,
        message: true,
        visibility: true,
        admin: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return res
      .status(API_CODE.ACCEPTED)
      .json(new ApiResponse(API_CODE.ACCEPTED, updatedNote, "Note updated"));
  } catch (error) {
    console.error("Error updating ticket note:", error);
    return res
      .status(API_CODE.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(
          API_CODE.INTERNAL_SERVER_ERROR,
          "Something went wrong while updating note",
        ),
      );
  }
};

const DeleteTicketNote = async (req, res) => {
  try {
    const admin = req.admin;
    const { noteId } = req.params;

    if (!admin) {
      return res
        .status(API_CODE.UNAUTHORIZED)
        .json(new ApiError(API_CODE.UNAUTHORIZED, "Unauthorized"));
    }

    if (!noteId) {
      return res
        .status(API_CODE.BAD_REQUEST)
        .json(new ApiError(API_CODE.BAD_REQUEST, "noteId is required"));
    }

    const note = await prisma.ticketNote.findUnique({ where: { id: noteId } });
    if (!note) {
      return res
        .status(API_CODE.NOT_FOUND)
        .json(new ApiError(API_CODE.NOT_FOUND, "Note not found"));
    }

    if (
      note.visibility === NOTE_VISIBILITY.PRIVATE &&
      note.adminId !== admin.id
    ) {
      return res
        .status(API_CODE.FORBIDDEN)
        .json(
          new ApiError(
            API_CODE.FORBIDDEN,
            "Only the note owner can delete this private note",
          ),
        );
    }

    await prisma.ticketNote.delete({ where: { id: noteId } });

    return res
      .status(API_CODE.ACCEPTED)
      .json(new ApiResponse(API_CODE.ACCEPTED, { id: noteId }, "Note deleted"));
  } catch (error) {
    console.error("Error deleting ticket note:", error);
    return res
      .status(API_CODE.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(
          API_CODE.INTERNAL_SERVER_ERROR,
          "Something went wrong while deleting note",
        ),
      );
  }
};

export { CreateTicketNote, GetTicketNotes, UpdateTicketNote, DeleteTicketNote };
