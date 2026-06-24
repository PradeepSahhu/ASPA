import jwt from "jsonwebtoken";
import { ApiError } from "../utility/api.error.js";
import "dotenv/config";
import { API_CODE } from "../utility/constants/api.constants.js";
import { ROLE } from "../utility/constants/role.constants.js";

import prisma from "../utility/database/index.js";

const Authenticate = async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "unauthorized");
    }

    const decodedtoken = await jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET,
    );

    if (decodedtoken.actor === ROLE.AUTHOR) {
      const author = await prisma.author.findUnique({
        where: { id: decodedtoken?._id },
      });

      if (!author) {
        throw new ApiError(API_CODE.UNAUTHORIZED, "Invalid access token");
      }
      req.author = author;
    } else if (decodedtoken.actor === ROLE.ADMIN) {
      const admin = await prisma.admin.findUnique({
        where: { id: decodedtoken?._id },
      });

      if (!admin) {
        throw new ApiError(API_CODE.UNAUTHORIZED, "Invalid access token");
      }
      req.admin = admin;
    } else {
      throw new ApiError(401, "unauthorized");
    }

    next();
  } catch (error) {
    throw new ApiError(
      API_CODE.UNAUTHORIZED,
      error?.message || "Invalid access token",
    );
  }
};

export default Authenticate;
