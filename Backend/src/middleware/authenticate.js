import jwt from "jsonwebtoken";
import { ApiError } from "../utility/api.error.js";
import "dotenv/config";
import { API_CODE } from "../utility/constants/api.constants.js";
import prisma from "../utility/database/index.js";

const Authenticate = async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "unauthorized");
    }

    console.log(process.env.ACCESS_TOKEN_SECRET);
    console.log("the token is : ", token);

    const decodedtoken = await jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET,
    );

    const author = await prisma.author.findUnique({
      where: { id: decodedtoken?._id },
    });

    if (!author) {
      throw new ApiError(API_CODE.INTERNAL_SERVER_ERROR, "", "");
    }

    req.author = author;

    next();
  } catch (error) {
    throw new ApiError(
      API_CODE.UNAUTHORIZED,
      error?.message || "Invalid access token",
    );
  }
};

export default Authenticate;
