import { AIProvider } from "./types";
import { AnthropicProvider } from "./providers/anthropic";
import { OpenAIProvider } from "./providers/openai";
import { OpenRouterProvider } from "./providers/openrouter";
import { GeminiProvider } from "./providers/gemini";

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || "gemini";

  switch (provider) {
    case "anthropic":
      return new AnthropicProvider();
    case "openai":
      return new OpenAIProvider();
    case "openrouter":
      return new OpenRouterProvider();
    case "gemini":
      return new GeminiProvider();
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}
