import { tool } from "@langchain/core/tools";
import * as z from "zod";
export const constFinalAnswerTool = tool(async ({ answer }) => answer, {
  name: "final_answer",
  description: "Call this when you have completed the task.",
  schema: z.object({
    answer: z.string(),
  }),
});
