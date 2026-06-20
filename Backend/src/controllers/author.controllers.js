import { ApiError } from "../utility/api.error.js";
import { ApiResponse } from "../utility/api.response.js";
import { API_CODE } from "../utility/constants/api.constants.js";
import prisma from "../utility/database/index.js";
import { generateAccessToken } from "../utility/tokens/access.token.js";

const AuthorLogin = async (req, res) => {
  const { email, password } = req.body;

  console.log(email, password);
  if (!email || !password) {
    return res
      .status(API_CODE.BAD_REQUEST)
      .json(new ApiResponse(API_CODE.BAD_REQUEST, "", "Bad Request"));
  }

  const author = await prisma.author.findUnique({
    where: { email },
  });

  //TODO:  hasing the password (bcrypt) in future

  if (!author || author.password !== password) {
    return res
      .status(API_CODE.UNAUTHORIZED)
      .json(new ApiResponse(API_CODE.UNAUTHORIZED, "", "Invalid credentials"));
  }

  const options = {
    httpOnly: true,
    secure: true,
  };

  const accessToken = await generateAccessToken(author.id, author.email);

  return res
    .status(API_CODE.ACCEPTED)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        API_CODE.ACCEPTED,
        { id: author.id, name: author.name, email: author.email },
        "success",
      ),
    );
};

const AuthorSignUp = async (req, res) => {
  const { id, username, email, password, phone_no, city, account_no } =
    req.body;

  if (!email || !password || !username) {
    return res
      .status(API_CODE.BAD_REQUEST)
      .json(
        new ApiResponse(
          API_CODE.BAD_REQUEST,
          "email and password are required",
          "Failed",
        ),
      );
  }

  const existing = await prisma.author.findUnique({ where: { email } });
  if (existing) {
    return res
      .status(API_CODE.CONFLICT)
      .json(new ApiResponse(API_CODE.CONFLICT, "", "Author already exists"));
  }

  //TODO: hash the password (bcrypt) before storing

  const author = await prisma.author.create({
    data: {
      ...(id && { id }),
      name: username,
      email,
      password,
      phone: phone_no,
      city,
      accountNumber: account_no,
      joinedDate: new Date(),
      updatedDate: new Date(),
    },
  });

  const createdAuthor = await prisma.author.findUnique({
    where: { id: author.id },
  });

  if (!createdAuthor) {
    return res
      .status(API_CODE.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(
          API_CODE.INTERNAL_SERVER_ERROR,
          "Something went wrong while registering the author",
        ),
      );
  }

  return res.status(API_CODE.ACCEPTED).json(
    new ApiResponse(
      API_CODE.ACCEPTED,
      {
        id: createdAuthor.id,
        name: createdAuthor.name,
        email: createdAuthor.email,
      },
      "success",
    ),
  );
};

const AuthorLogout = async (req, res) => {
  const author = req.author;

  if (!author) {
    return new ApiError(API_CODE.FORBIDDEN, "", "Failed");
  }

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, {}, "user Logged Out"));
};

export { AuthorLogin, AuthorSignUp, AuthorLogout };
