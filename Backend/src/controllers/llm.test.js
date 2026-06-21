import { LlmInvoke } from "../llm/lllm.js";
import { ApiError } from "../utility/api.error.js";
import { ApiResponse } from "../utility/api.response.js";
import { API_CODE } from "../utility/constants/api.constants.js";

export const llmTest = async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res
      .status(API_CODE.BAD_REQUEST)
      .json(
        new ApiError(
          API_CODE.BAD_REQUEST,
          "User prompt is mendatory",
          "Failed",
        ),
      );
  }
  const llmRes = await LlmInvoke(prompt);

  return res
    .status(API_CODE.ACCEPTED)
    .json(new ApiResponse(API_CODE.ACCEPTED, llmRes, "Success"));
};
