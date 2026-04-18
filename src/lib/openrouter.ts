/**
 * OpenRouter AI Client
 * Provides unified access to 300+ models via OpenRouter API
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatOptions {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

export interface ChatResponse {
  id: string;
  model: string;
  choices: {
    message: { content: string; role: string };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost: number;
  };
}

// Default model - fast & cheap
export const DEFAULT_MODEL = 'google/gemini-2.0-flash-lite-001';

// Popular models for different use cases
export const MODELS = {
  fast: 'google/gemini-2.0-flash-lite-001',
  balanced: 'google/gemini-2.5-flash',
  reasoning: 'deepseek/deepseek-r1-0528',
  coding: 'qwen/qwen3-coder-30b-a3b-instruct',
  vision: 'google/gemini-2.5-pro',
} as const;

/**
 * Send a chat completion request to OpenRouter
 */
export async function chat(options: ChatOptions): Promise<ChatResponse> {
  const model = options.model || DEFAULT_MODEL;
  
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://studio.local',
      'X-Title': 'StudioOS',
    },
    body: JSON.stringify({
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 4096,
      top_p: options.top_p ?? 1,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenRouter error: ${error.error?.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Simple text completion
 */
export async function complete(prompt: string, options?: Partial<ChatOptions>): Promise<string> {
  const result = await chat({
    model: options?.model || DEFAULT_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: options?.temperature,
    max_tokens: options?.max_tokens,
  });
  
  return result.choices[0].message.content;
}

/**
 * List available models
 */
export async function listModels() {
  const response = await fetch(`${OPENROUTER_BASE_URL}/models`, {
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to list models: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.data;
}

// Test function
if (require.main === module) {
  (async () => {
    console.log('Testing OpenRouter...');
    const result = await complete('Say "OpenRouter works!" in 3 words');
    console.log('Result:', result);
  })();
}

export { chat, complete, listModels, MODELS, DEFAULT_MODEL };