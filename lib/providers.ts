import { openai } from "@ai-sdk/openai"
import { google } from "@ai-sdk/google"
import { xai } from "@ai-sdk/xai"

export const providers = {
  openai: {
    name: "OpenAI",
    models: {
      "gpt-4o": "GPT-4o",
      "gpt-4o-mini": "GPT-4o Mini",
      "gpt-4-turbo": "GPT-4 Turbo",
    },
    getModel: (model: string) => openai(model),
  },
  google: {
    name: "Google",
    models: {
      "gemini-1.5-pro": "Gemini 1.5 Pro",
      "gemini-1.5-flash": "Gemini 1.5 Flash",
      "gemini-2.0-flash-exp": "Gemini 2.0 Flash (Experimental)",
    },
    getModel: (model: string) => google(model),
  },
  xai: {
    name: "xAI",
    models: {
      "grok-3": "Grok 3",
      "grok-3-mini": "Grok 3 Mini",
      "grok-beta": "Grok Beta",
    },
    getModel: (model: string) => xai(model),
  },
} as const

export type ProviderKey = keyof typeof providers
export type ModelKey<T extends ProviderKey> = keyof (typeof providers)[T]["models"]
