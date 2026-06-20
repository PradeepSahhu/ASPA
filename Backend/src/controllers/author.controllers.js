import { ApiResponse } from "../utility/api.response.js";
import { API_CODE } from "../utility/constants/api.constants.js";

const AuthorLogin = async (req, res) => {
  const { email, password } = req.body;

  console.log(email, password);
  if (!email || !password) {
    return new ApiResponse(API_CODE.BAD_REQUEST, "", "Bad Request");
  }

  return new ApiResponse(API_CODE.ACCEPTED, { user: "Pradeep" }, "success");
};

export { AuthorLogin };
