import jwt from "jsonwebtoken";

const generateAccessToken = async (id, email, actor) => {
  return jwt.sign(
    {
      _id: id,
      email: email,
      actor,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "1d",
    },
  );
};

export { generateAccessToken };
