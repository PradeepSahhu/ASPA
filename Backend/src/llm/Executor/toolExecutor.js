import { ToolMessage } from "@langchain/core/messages";
import { toolRegistry } from "../Registry/toolRegistry.js";

const executeSingleToolCall = async (toolCall, userId) => {
  if (toolCall.name === "final_answer") {
    return {
      isFinal: true,
      result: toolCall.args?.answer,
    };
  }

  const tool = toolRegistry[toolCall.name];
  if (!tool) {
    return {
      isFinal: false,
      result: null,
    };
  }

  const toolInput = String(userId || "");
  const result = await tool.invoke(toolInput);

  return {
    isFinal: false,
    toolMessage: new ToolMessage({
      tool_call_id: toolCall.id,
      content: typeof result === "string" ? result : JSON.stringify(result),
    }),
  };
};

export const executeToolLoop = async (modelWithTool, messages, userId) => {
  while (true) {
    const aiResponse = await modelWithTool.invoke(messages);
    messages.push(aiResponse);

    const toolCalls = aiResponse.tool_calls || [];

    if (!toolCalls.length) {
      return aiResponse.content;
    }

    for (const toolCall of toolCalls) {
      const execution = await executeSingleToolCall(toolCall, userId);

      if (execution.isFinal) {
        return execution.result || aiResponse.content;
      }

      if (execution.toolMessage) {
        messages.push(execution.toolMessage);
      }
    }
  }
};
