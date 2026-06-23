import { z } from "zod";
import {
  PRIORITY,
  PRIORITY_LABELS,
} from "../../utility/constants/priority.constants.js";

const AnalyzeTicketPrioritySchema = z.object({
  header: z.string().describe("The ticket header/title"),
  description: z.string().describe("The ticket description/content"),
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
    "Analyzes ticket header and description to determine priority score (Critical/High/Medium/Low). Returns numeric score (4=Critical, 3=High, 2=Medium, 1=Low)",
  schema: AnalyzeTicketPrioritySchema,
  execute: async ({ header = "", description = "" }) => {
    const content = `${header} ${description}`.toLowerCase();

    let score = PRIORITY.LOW;
    let priority = PRIORITY_LABELS[PRIORITY.LOW];

    // Critical keywords - payment, account access, urgent, broken, can't login
    const criticalKeywords = [
      "royalty",
      "payment",
      "money",
      "haven't received",
      "account access",
      "can't login",
      "can't sign in",
      "data loss",
      "urgent",
      "critical",
      "emergency",
      "hacked",
      "fraudulent",
    ];

    // High keywords - bugs, errors, functionality issues
    const highKeywords = [
      "bug",
      "broken",
      "doesn't work",
      "not working",
      "error",
      "crash",
      "fail",
      "can't upload",
      "can't download",
      "important",
      "asap",
      "immediately",
    ];

    // Medium keywords - improvements, concerns
    const mediumKeywords = [
      "slow",
      "lag",
      "update",
      "improve",
      "concern",
      "issue",
      "problem",
      "question about",
      "help with",
    ];

    // Check for Critical
    if (criticalKeywords.some((keyword) => content.includes(keyword))) {
      score = PRIORITY.CRITICAL;
      priority = PRIORITY_LABELS[PRIORITY.CRITICAL];
    }
    // Check for High (if not critical)
    else if (highKeywords.some((keyword) => content.includes(keyword))) {
      score = PRIORITY.HIGH;
      priority = PRIORITY_LABELS[PRIORITY.HIGH];
    }
    // Check for Medium (if not high or critical)
    else if (mediumKeywords.some((keyword) => content.includes(keyword))) {
      score = PRIORITY.MEDIUM;
      priority = PRIORITY_LABELS[PRIORITY.MEDIUM];
    }

    return {
      success: true,
      score,
      priority,
      reason: `Analyzed content and assigned priority: ${priority} (score: ${score})`,
    };
  },
};
