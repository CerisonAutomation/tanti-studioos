import { OpenRouter } from '@openrouter/sdk';

const openrouter = new OpenRouter(process.env.OPENROUTER_API_KEY);

// List available models
async function main() {
  const models = await openrouter.models.list();
  console.log('Available models:', models.data.slice(0, 5).map(m => m.id));
  
  // Test chat completion
  const chat = await openrouter.chat.completions.create({
    model: 'openai/gpt-4o-mini',
    messages: [{ role: 'user', content: 'Hello!' }]
  });
  console.log('Response:', chat.choices[0].message.content);
}

main().catch(console.error);