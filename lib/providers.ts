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
      "gemini-2.0-flash": "Gemini 2.0 Flash",
      "gemini-1.5-flash": "Gemini 1.5 Flash",
      "gemini-1.5-pro": "Gemini 1.5 Pro",
    },
    getModel: (model: string) => google(model),
  },
  xai: {
    name: "xAI",
    models: {
      "grok-beta": "Grok Beta",
      "grok-2": "Grok 2",
    },
    getModel: (model: string) => xai(model),
  },
} as const;

export type ProviderKey = keyof typeof providers;
export type ModelKey<T extends ProviderKey> =
  keyof (typeof providers)[T]["models"];
