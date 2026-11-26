import { ChatOpenAI } from "@langchain/openai";
import config from "../config";
import { RunnableLambda } from "@langchain/core/runnables";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

const fallbackChatModels = config.open_route_fallback_chat_model;

export const OpenRouteChatModels = new ChatOpenAI({
  model: config.open_route_chat_model,
  apiKey: config.open_route_api_key,
  temperature: 0.2,

  modelKwargs: {
    models: [config.open_route_chat_model, ...fallbackChatModels],
  },

  configuration: {
    baseURL: OPENROUTER_BASE_URL,
    defaultHeaders: {
      "HTTP-Referer": config.frontend_url ?? "http://localhost:3000",
      "X-Title": "CivicFlow",
    },
  },
});

export const chatModel = RunnableLambda.from(
    async (input: string , options) => {
        try {
            return await OpenRouteChatModels.invoke(input, options);
        } catch (error) {
            console.error("Error invoking OpenRouteChatModels:", error);
            throw error;
        }
    }
).withRetry({stopAfterAttempt: 3});