import { z } from "zod";
import {
  PRIORITY,
  PRIORITY_LABELS,
} from "../../utility/constants/priority.constants.js";

const AnalyzeTicketPrioritySchema = z.object({
  header: z.string().describe("The ticket header/title"),
  description: z.string().describe("The ticket description/content"),
  priorityScore: z
    .number()
    .int()
    .min(1)
    .max(4)
    .describe(
      "Model-selected priority score (1=Low, 2=Medium, 3=High, 4=Critical)",
    ),
  rationale: z
    .string()
    .min(5)
    .describe("Short reason for the selected priority score"),
});

/**
 * Priority Score Mapping:
 * 1 = Low (general inquiries, feature requests)
 * 2 = Medium (minor bugs, account updates)
 * 3 = High (broken functionality, urgent matters)
 * 4 = Critical (payment issues, data loss, account access)
 */

export const AnalyzeTicketPriority = {
  name: "analyze_ticket_priority",
  description:
    "Validates and normalizes a model-selected priority score. The model must decide the score and provide rationale. Returns numeric score (4=Critical, 3=High, 2=Medium, 1=Low)",
  schema: AnalyzeTicketPrioritySchema,
  execute: async ({ priorityScore, rationale }) => {
    const score = priorityScore;
    const priority = PRIORITY_LABELS[score] || PRIORITY_LABELS[PRIORITY.LOW];

    return {
      success: true,
      score,
      priority,
      reason: `Model selected ${priority} (score: ${score}). Rationale: ${rationale}`,
    };
  },
};
