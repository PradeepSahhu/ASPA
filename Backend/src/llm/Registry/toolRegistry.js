import { GetAuthorInfo, GetAuthorBooks } from "../Tools/Database.tool.js";
import { constFinalAnswerTool } from "../Tools/finalAnswer.tool.js";

export const toolRegistry = {
  [GetAuthorInfo.name]: GetAuthorInfo,
  [GetAuthorBooks.name]: GetAuthorBooks,
  [constFinalAnswerTool.name]: constFinalAnswerTool,
};

export const allTools = [GetAuthorInfo, GetAuthorBooks, constFinalAnswerTool];
