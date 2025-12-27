export const DEFAULT_CHAT_MODEL: string = "claude-sonnet-4.5";

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
];
