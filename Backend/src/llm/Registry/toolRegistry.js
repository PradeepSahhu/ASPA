import { tool } from "@langchain/core/tools";
import { GetAuthorInfo, GetAuthorBooks } from "../Tools/Database.tool.js";
import { constFinalAnswerTool } from "../Tools/finalAnswer.tool.js";
import { AnalyzeTicketPriority } from "../Tools/AnalyzeTicketPriority.tool.js";
import { UpdateTicketPriority } from "../Tools/UpdateTicketPriority.tool.js";

// Registry of tool definitions (name => tool object with schema and execute)
export const toolRegistry = {
  [GetAuthorInfo.name]: GetAuthorInfo,
  [GetAuthorBooks.name]: GetAuthorBooks,
  [constFinalAnswerTool.name]: constFinalAnswerTool,
  [AnalyzeTicketPriority.name]: AnalyzeTicketPriority,
  [UpdateTicketPriority.name]: UpdateTicketPriority,
};

// Helper to wrap plain tool objects for Langchain's bindTools
const wrapToolForLangchain = (toolObj) =>
  tool(
    async (args) => {
      const result = await toolObj.execute(args);
      return typeof result === "string" ? result : JSON.stringify(result);
    },
    {
      name: toolObj.name,
      description: toolObj.description,
      schema: toolObj.schema,
    },
  );

// Langchain-compatible tools for LLM binding
export const allTools = Object.values(toolRegistry).map(wrapToolForLangchain);
