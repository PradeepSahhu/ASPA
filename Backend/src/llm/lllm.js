import { ChatDeepSeek } from "@langchain/deepseek";
import { DB_SYSTEM_PROMPT } from "./Prompts/Database.prompt.js";
import { allTools } from "./Registry/toolRegistry.js";
import { executeToolLoop } from "./Executor/toolExecutor.js";

const model = new ChatDeepSeek({
  model: "deepseek-v4-flash",
  temperature: 0,
});

const modelWithTool = model.bindTools(allTools);

export const callLLM = async ({ systemPrompt, userPrompt, userId }) => {
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "human", content: userPrompt },
  ];

  return await executeToolLoop(modelWithTool, messages, userId);
};

export const LlmInvoke = async (userPrompt, userId) => {
  return await callLLM({
    systemPrompt: DB_SYSTEM_PROMPT,
    userPrompt: `The user Query is ${userPrompt} and the current author id ${userId}`,
    userId,
  });
};
