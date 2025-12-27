import { gateway } from "@ai-sdk/gateway";
import { customProvider } from "ai";
import { isTestEnvironment } from "../constants";

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : customProvider({
      languageModels: {
        "claude-sonnet-4.5": gateway.languageModel("anthropic/claude-sonnet-4-5"),
        "title-model": gateway.languageModel("anthropic/claude-sonnet-4-5"),
        "artifact-model": gateway.languageModel("anthropic/claude-sonnet-4-5"),
      },
    });
