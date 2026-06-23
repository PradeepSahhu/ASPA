import { z } from "zod";
import prisma from "../../utility/database/index.js";
import {
  PRIORITY_LABELS,
  PRIORITY_SCORES,
} from "../../utility/constants/priority.constants.js";

const UpdateTicketPrioritySchema = z.object({
  ticketId: z.string().describe("The ID of the ticket to update"),
  priorityScore: z
    .number()
    .describe("Priority score (1=Low, 2=Medium, 3=High, 4=Critical)"),
});

export const UpdateTicketPriority = {
  name: "update_ticket_priority",
  description:
    "Updates ticket priority score in DB (1=Low, 2=Medium, 3=High, 4=Critical)",
  schema: UpdateTicketPrioritySchema,
  execute: async ({ ticketId, priorityScore: rawPriorityScore }) => {
    try {
      const priorityScore = Number(rawPriorityScore);

      if (!ticketId || Number.isNaN(priorityScore)) {
        return {
          success: false,
          error: "ticketId and priorityScore are required",
        };
      }

      if (!PRIORITY_SCORES.includes(priorityScore)) {
        return {
          success: false,
          error: `priorityScore must be one of: ${PRIORITY_SCORES.join(", ")}`,
        };
      }

      const updatedTicket = await prisma.ticket.update({
        where: { id: ticketId },
        data: { priorityScore },
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
        message: `Ticket ${ticketId} updated with priority: ${PRIORITY_LABELS[priorityScore]}`,
        ticket: updatedTicket,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};
