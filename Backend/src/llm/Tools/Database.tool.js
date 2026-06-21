import * as z from "zod";
import { tool } from "@langchain/core/tools";
import prisma from "../../utility/database/index.js";

// Will give DB READ access to my llm. Why? so that user can know some more information in the chat

export const GetBookInfo = tool(
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
    name: "get_all_user_books",
    description:
      "Get all books published by a specific author using the author id.",
    schema: z.string().describe("The unique id of the author"),
  },
);
