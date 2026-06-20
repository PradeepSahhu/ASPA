import { ApiError } from "../utility/api.error";
import { API_CODE } from "../utility/constants/api.constants";
import prisma from "../utility/database";

const createBook = async (req, res) => {
  const { id, title, description, genre } = req.body;

  if (!title || !genre) {
    return res
      .status(API_CODE.BAD_REQUEST)
      .json(
        new ApiError(API_CODE.BAD_REQUEST),
        "Book title or genre is required",
        "Failed",
      );
  }

  const author = req?.author;

  const newBookRequest = await prisma.book.create({
    ...(id && { id }),
    author_id: author.id,
    title,
    description,
    genre,
  });
};
