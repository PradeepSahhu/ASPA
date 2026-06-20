import { ApiError } from "../utility/api.error.js";
import { ApiResponse } from "../utility/api.response.js";
import { API_CODE } from "../utility/constants/api.constants.js";
import prisma from "../utility/database/index.js";

const createBook = async (req, res) => {
  const { id, title, genre, mrp } = req.body;

  if (!title || !genre) {
    return res
      .status(API_CODE.BAD_REQUEST)
      .json(
        new ApiError(API_CODE.BAD_REQUEST, "Book title and genre are required"),
      );
  }

  const author = req?.author;
  if (!author) {
    return res
      .status(API_CODE.UNAUTHORIZED)
      .json(new ApiError(API_CODE.UNAUTHORIZED, "Unauthorized"));
  }

  const newBookRequest = await prisma.book.create({
    data: {
      ...(id && { id }),
      authorId: author.id,
      title,
      genre,
      mrp,
    },
  });

  const createdBook = await prisma.book.findUnique({
    where: { id: newBookRequest.id },
  });

  if (!createdBook) {
    return res
      .status(API_CODE.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(
          API_CODE.INTERNAL_SERVER_ERROR,
          "Something went wrong while creating the book",
        ),
      );
  }

  return res
    .status(API_CODE.ACCEPTED)
    .json(new ApiResponse(API_CODE.ACCEPTED, createdBook, "success"));
};

export { createBook };
