import * as z from "zod";

const FinalAnswerSchema = z.object({
  answer: z.string(),
});

export const constFinalAnswerTool = {
  name: "final_answer",
  description: "Call this when you have completed the task.",
  schema: FinalAnswerSchema,
  execute: async ({ answer }) => answer,
};
