export const DEFAULT_CHAT_MODEL: string = "claude-sonnet-3.5";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "claude-sonnet-4.5",
    name: "Claude Sonnet 4.5",
    description: "Most capable Claude model with advanced reasoning",
  },
  {
    id: "claude-sonnet-3.5",
    name: "Claude Sonnet 3.5",
    description: "Balanced performance and speed for most tasks",
  },
  {
    id: "chat-model",
    name: "Grok Vision",
    description: "Advanced multimodal model with vision and text capabilities",
  },
  {
    id: "chat-model-reasoning",
    name: "Grok Reasoning",
    description:
      "Uses advanced chain-of-thought reasoning for complex problems",
  },
];
