import * as z from "zod";
import { tool } from "@langchain/core/tools";
import prisma from "../../utility/database/index.js";

// Will give DB READ access to my llm. Why? so that user can know some more information in the chat

export const GetAuthorInfo = tool(
  async (userId) => {
    const author = await prisma.author.findUnique({ where: { id: userId } });

    if (!author) {
      return `No author found with id ${userId}.`;
    }

    return `Author name: ${author.name || author.email}, Email: ${author.email}.`;
  },
  {
    name: "get_author_info",
    description:
      "Get information about a specific author using their author id.",
    schema: z.string().describe("The unique id of the author"),
  },
);

export const GetAuthorBooks = tool(
  async (userId) => {
    const author = await prisma.author.findUnique({ where: { id: userId } });

    if (!author) {
      return `No author found with id ${userId}.`;
    }

    const books = await prisma.book.findMany({
      where: { authorId: userId },
      select: { title: true },
    });

    if (!books.length) {
      return `Author ${author.name || author.email || userId} has not published any books yet.`;
    }

    const titles = books.map((book) => book.title).join(", ");

    return `Author ${author.name || author.email || userId} has published these books: ${titles}.`;
  },
  {
    name: "get_author_books",
    description:
      "Get all books published by a specific author using the author id.",
    schema: z.string().describe("The unique id of the author"),
  },
);
