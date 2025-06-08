import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { xai } from "@ai-sdk/xai";

export const providers = {
  openai: {
    name: "OpenAI",
    models: {
      "gpt-4o": "GPT-4o",
      "gpt-4o-mini": "GPT-4o Mini",
    },
    getModel: (model: string) => openai(model),
  },
  google: {
    name: "Google",
    models: {
      "gemini-2.5-pro-preview-06-05": "Gemini 2.5 Pro Preview",
      "gemini-2.5-flash-preview-05-20": "Gemini 2.5 Pro Preview 05-06",
    },
    getModel: (model: string) => google(model),
  },
  xai: {
    name: "xAI",
    models: {
      "grok-3": "Grok 3",
      "grok-3-mini": "Grok 3 Mini",
    },
    getModel: (model: string) => xai(model),
  },
} as const;

export type ProviderKey = keyof typeof providers;
export type ModelKey<T extends ProviderKey> =
  keyof (typeof providers)[T]["models"];
