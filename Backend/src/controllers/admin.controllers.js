import { ApiError } from "../utility/api.error.js";
import { ApiResponse } from "../utility/api.response.js";
import { API_CODE } from "../utility/constants/api.constants.js";
import { ROLE } from "../utility/constants/role.constants.js";
import prisma from "../utility/database/index.js";
import { generateAccessToken } from "../utility/tokens/access.token.js";

const AdminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(API_CODE.BAD_REQUEST)
      .json(new ApiResponse(API_CODE.BAD_REQUEST, "", "Bad Request"));
  }

  const admin = await prisma.admin.findUnique({
    where: { email },
  });

  //TODO:  hasing the password (bcrypt) in future

  if (!admin || admin.password !== password) {
    return res
      .status(API_CODE.UNAUTHORIZED)
      .json(new ApiResponse(API_CODE.UNAUTHORIZED, "", "Invalid credentials"));
  }

  const options = {
    httpOnly: true,
    secure: true,
  };

  const accessToken = await generateAccessToken(
    admin.id,
    admin.email,
    ROLE.ADMIN,
  );

  return res
    .status(API_CODE.ACCEPTED)
    .header("Authorization", `Bearer ${accessToken}`)
    .header("x-access-token", accessToken)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        API_CODE.ACCEPTED,
        { id: admin.id, name: admin.name, email: admin.email },
        "success",
      ),
    );
};

const AdminSignUp = async (req, res) => {
  const { id, username, email, password, contact_info } = req.body;

  if (!email || !password || !username) {
    return res
      .status(API_CODE.BAD_REQUEST)
      .json(
        new ApiResponse(
          API_CODE.BAD_REQUEST,
          "email, password, and username are required",
          "Failed",
        ),
      );
  }

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    return res
      .status(API_CODE.CONFLICT)
      .json(new ApiResponse(API_CODE.CONFLICT, "", "Admin already exists"));
  }

  //TODO: hash the password (bcrypt) before storing

  const admin = await prisma.admin.create({
    data: {
      ...(id && { id }),
      name: username,
      email,
      password,
      contactInfo: contact_info,
      joinedDate: new Date(),
      updatedDate: new Date(),
    },
  });

  const createdAdmin = await prisma.admin.findUnique({
    where: { id: admin.id },
  });

  if (!createdAdmin) {
    return res
      .status(API_CODE.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(
          API_CODE.INTERNAL_SERVER_ERROR,
          "Something went wrong while registering the admin",
        ),
      );
  }

  return res.status(API_CODE.ACCEPTED).json(
    new ApiResponse(
      API_CODE.ACCEPTED,
      {
        id: createdAdmin.id,
        name: createdAdmin.name,
        email: createdAdmin.email,
      },
      "success",
    ),
  );
};

const AdminLogout = async (req, res) => {
  const admin = req.admin;

  if (!admin) {
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

export { AdminLogin, AdminSignUp, AdminLogout };
