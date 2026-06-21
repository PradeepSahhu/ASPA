import { ChatDeepSeek } from "@langchain/deepseek";
import { ToolMessage } from "@langchain/core/messages";
import { GetBookInfo } from "./Tools/Database.tool.js";
import { constFinalAnswerTool } from "./Tools/finalAnswer.tool.js";
import { DB_SYSTEM_PROMPT } from "./Prompts/Database.prompt.js";

const getTextContent = (content) => {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .filter((part) => part && part.type === "text")
      .map((part) => part.text)
      .join("\n")
      .trim();
  }

  return "";
};

export const LlmInvoke = async (userPrompt, userId) => {
  const model = new ChatDeepSeek({
    model: "deepseek-v4-flash",
    temperature: 0,
  });

  const modelWithTool = model.bindTools([GetBookInfo, constFinalAnswerTool]);

  const messages = [
    { role: "system", content: DB_SYSTEM_PROMPT },
    {
      role: "human",
      content: `The user Query is ${userPrompt} and the current author id ${userId}`,
    },
  ];

  for (let step = 0; step < 3; step += 1) {
    const aiResponse = await modelWithTool.invoke(messages);
    messages.push(aiResponse);

    const toolCalls = aiResponse.tool_calls || [];

    if (!toolCalls.length) {
      return getTextContent(aiResponse.content);
    }

    for (const toolCall of toolCalls) {
      if (toolCall.name === constFinalAnswerTool.name) {
        const finalAnswer = toolCall.args?.answer;
        if (typeof finalAnswer === "string" && finalAnswer.trim()) {
          return finalAnswer.trim();
        }
        return getTextContent(aiResponse.content);
      }

      if (toolCall.name !== GetBookInfo.name) {
        continue;
      }

      const toolInput =
        typeof toolCall.args === "string"
          ? toolCall.args
          : String(userId || "");
      const result = await GetBookInfo.invoke(toolInput);

      messages.push(
        new ToolMessage({
          tool_call_id: toolCall.id,
          content: typeof result === "string" ? result : JSON.stringify(result),
        }),
      );
    }
  }

  return "I could not finish generating the final answer. Please try again.";
};
