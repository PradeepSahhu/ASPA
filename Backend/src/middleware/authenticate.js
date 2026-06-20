import jwt from "jsonwebtoken";
import { ApiError } from "../utility/api.error.js";
import "dotenv/config";
import { API_CODE } from "../utility/constants/api.constants.js";

const Authenticate = async (req, _, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "unauthorized");
    }

    console.log(process.env.ACCESS_TOKEN_SECRET);

    const decodedtoken = await jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET,
    );

    next();
  } catch (error) {
    throw new ApiError(
      API_CODE.UNAUTHORIZED,
      error?.message || "Invalid access token",
    );
  }
};
