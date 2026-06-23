import { ToolMessage } from "@langchain/core/messages";
import { toolRegistry } from "../Registry/toolRegistry.js";

const executeSingleToolCall = async (toolCall, userId) => {
  // Handle final_answer specially - it terminates execution
  if (toolCall.name === "final_answer") {
    return {
      isFinal: true,
      result: toolCall.args?.answer || toolCall.args,
    };
  }

  // Look up tool in registry
  const toolDef = toolRegistry[toolCall.name];
  if (!toolDef) {
    return {
      isFinal: false,
      result: null,
    };
  }

  try {
    // Validate arguments against schema
    const validatedArgs = toolDef.schema.parse(toolCall.args);

    // Execute the tool
    const result = await toolDef.execute(validatedArgs);

    return {
      isFinal: false,
      toolMessage: new ToolMessage({
        tool_call_id: toolCall.id,
        content: typeof result === "string" ? result : JSON.stringify(result),
      }),
    };
  } catch (error) {
    return {
      isFinal: false,
      toolMessage: new ToolMessage({
        tool_call_id: toolCall.id,
        content: JSON.stringify({
          error: error.message,
          success: false,
        }),
      }),
    };
  }
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
