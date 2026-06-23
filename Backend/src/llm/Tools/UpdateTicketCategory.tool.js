import { z } from "zod";
import prisma from "../../utility/database/index.js";

const VALID_CATEGORIES = [
  "Royalty & Payments",
  "ISBN & Metadata Issues",
  "Printing & Quality",
  "Distribution & Availability",
  "Book Status & Production Updates",
  "General Inquiry",
];

const UpdateTicketCategorySchema = z.object({
  ticketId: z.string().describe("The ID of the ticket to update"),
  category: z
    .string()
    .describe(
      "The category to assign (one of: Royalty & Payments, ISBN & Metadata Issues, Printing & Quality, Distribution & Availability, Book Status & Production Updates, General Inquiry)",
    ),
});

export const UpdateTicketCategory = {
  name: "update_ticket_category",
  description:
    "Updates ticket category in DB. Valid categories: Royalty & Payments, ISBN & Metadata Issues, Printing & Quality, Distribution & Availability, Book Status & Production Updates, General Inquiry",
  schema: UpdateTicketCategorySchema,
  execute: async ({ ticketId, category }) => {
    try {
      if (!ticketId) {
        return {
          success: false,
          error: "ticketId is required",
        };
      }

      if (!VALID_CATEGORIES.includes(category)) {
        return {
          success: false,
          error: `category must be one of: ${VALID_CATEGORIES.join(", ")}`,
        };
      }

      const updatedTicket = await prisma.ticket.update({
        where: { id: ticketId },
        data: { category },
        select: {
          id: true,
          header: true,
          category: true,
          status: true,
          updatedDate: true,
        },
      });

      return {
        success: true,
        message: `Ticket ${ticketId} updated with category: ${category}`,
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
