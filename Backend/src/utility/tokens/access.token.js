import jwt from "jsonwebtoken";

const generateAccessToken = async (id, email) => {
  return jwt.sign(
    {
      _id: id,
      email: email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "1d",
    },
  );
};

export { generateAccessToken };
