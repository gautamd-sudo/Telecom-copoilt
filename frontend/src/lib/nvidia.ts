import OpenAI from 'openai';

export const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '';
export const NVIDIA_BASE_URL = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
export const NVIDIA_MODEL = process.env.NVIDIA_MODEL || 'deepseek-ai/deepseek-v4.1-flash';

export const nvidiaClient = new OpenAI({
  apiKey: NVIDIA_API_KEY,
  baseURL: NVIDIA_BASE_URL,
});

export async function askDeepSeek(
  prompt: string,
  imageUrl?: string,
  options?: { systemPrompt?: string; temperature?: number }
) {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

  if (options?.systemPrompt) {
    messages.push({ role: 'system', content: options.systemPrompt });
  }

  if (imageUrl) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imageUrl } },
      ],
    });
  } else {
    messages.push({
      role: 'user',
      content: prompt,
    });
  }

  const completion = await nvidiaClient.chat.completions.create({
    model: NVIDIA_MODEL,
    messages,
    temperature: options?.temperature ?? 0.2,
  });

  return completion.choices[0]?.message?.content || '';
}
