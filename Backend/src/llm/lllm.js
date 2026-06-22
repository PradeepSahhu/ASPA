import { ChatDeepSeek } from "@langchain/deepseek";
import { ToolMessage } from "@langchain/core/messages";
import { GetAuthorInfo, GetAuthorBooks } from "./Tools/Database.tool.js";
import { constFinalAnswerTool } from "./Tools/finalAnswer.tool.js";
import { DB_SYSTEM_PROMPT } from "./Prompts/Database.prompt.js";

// const getTextContent = (content) => {
//   if (typeof content === "string") {
//     return content;
//   }

//   if (Array.isArray(content)) {
//     return content
//       .filter((part) => part && part.type === "text")
//       .map((part) => part.text)
//       .join("\n")
//       .trim();
//   }

//   return "";
// };

export const LlmInvoke = async (userPrompt, userId) => {
  const model = new ChatDeepSeek({
    model: "deepseek-v4-flash",
    temperature: 0,
  });

  const modelWithTool = model.bindTools([
    GetAuthorInfo,
    GetAuthorBooks,
    constFinalAnswerTool,
  ]);

  const toolsByName = {
    [GetAuthorInfo.name]: GetAuthorInfo,
    [GetAuthorBooks.name]: GetAuthorBooks,
  };

  const messages = [
    { role: "system", content: DB_SYSTEM_PROMPT },
    {
      role: "human",
      content: `The user Query is ${userPrompt} and the current author id ${userId}`,
    },
  ];

  // llm execution loop with max iteration of 3
  while (true) {
    const aiResponse = await modelWithTool.invoke(messages);
    // console.log(aiResponse);
    messages.push(aiResponse);

    const toolCalls = aiResponse.tool_calls || [];

    if (!toolCalls.length) {
      return aiResponse.content;
    }

    for (const toolCall of toolCalls) {
      if (toolCall.name === constFinalAnswerTool.name) {
        return toolCall.args?.answer.trim() || aiResponse.content;
      }

      //   if (
      //     toolCall.name !== GetAuthorInfo.name &&
      //     toolCall.name !== GetAuthorBooks.name
      //   ) {
      //     continue;
      //   }

      const toolInput =
        typeof toolCall.args === "string"
          ? toolCall.args
          : String(userId || "");

      const tool = toolsByName[toolCall.name];
      if (!tool) continue;

      const result = await tool.invoke(toolInput);

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
