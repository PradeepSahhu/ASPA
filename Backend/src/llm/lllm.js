import { ChatDeepSeek } from "@langchain/deepseek";

export const LlmInvoke = async (userPrompt) => {
  const model = new ChatDeepSeek({
    model: "deepseek-v4-flash",
    temperature: 0.7,
  });

  const res = await model.invoke([{ role: "human", content: userPrompt }]);

  return res;
};
