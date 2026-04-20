import axios from 'axios';
import { Platform } from '@prisma/client';
import type { AIProvider } from '../automation/automation.types';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export interface GenerateContentInput {
  userId: string;
  prompt: string;
  aiProvider: AIProvider;
  aiApiKey: string;
  platform?: Platform;
}

export interface GeneratedContent {
  content: string;
  hashtags: string[];
  imagePrompt?: string;
  imageUrl?: string;
}

export class ContentGeneratorService {
  async generate(input: GenerateContentInput): Promise<GeneratedContent> {
    if (!input.aiApiKey || input.aiApiKey.startsWith('mock_')) {
      return this.generateMockContent(input);
    }

    try {
      switch (input.aiProvider) {
        case 'OPENAI':
          return await this.generateWithOpenAI(input);
        case 'ANTHROPIC':
          return await this.generateWithAnthropic(input);
        case 'GEMINI':
          return await this.generateWithGemini(input);
        default:
          return this.generateMockContent(input);
      }
    } catch (error) {
      console.error(`Error generating content for user ${input.userId}:`, error);
      return this.generateMockContent(input);
    }
  }

  async generatePost(topic: string, platform: Platform, tone?: string): Promise<{
    content: string;
    hashtags: string[];
  }> {
    const prompt = [
      `Tema: ${topic}`,
      `Plataforma: ${platform}`,
      tone ? `Tom: ${tone}` : undefined
    ].filter(Boolean).join('\n');

    const result = await this.generate({
      userId: 'manual-preview',
      prompt,
      aiProvider: 'ANTHROPIC',
      aiApiKey: process.env.ANTHROPIC_API_KEY || '',
      platform
    });

    return {
      content: result.content,
      hashtags: result.hashtags
    };
  }

  async generateHashtags(topic: string, count: number = 5): Promise<string[]> {
    return this.generateMockHashtags(topic, count);
  }

  private buildPrompt(input: GenerateContentInput) {
    return [
      `User: ${input.userId}`,
      input.platform ? `Platform: ${input.platform}` : undefined,
      input.prompt,
      'Responda em JSON com {"content":"...","hashtags":["#..."],"imagePrompt":"..."}'
    ].filter(Boolean).join('\n\n');
  }

  private async generateWithAnthropic(input: GenerateContentInput): Promise<GeneratedContent> {
    const response = await axios.post(
      ANTHROPIC_API_URL,
      {
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1200,
        messages: [{ role: 'user', content: this.buildPrompt(input) }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': input.aiApiKey,
          'anthropic-version': '2023-06-01'
        }
      }
    );

    return this.parseProviderResponse(response.data.content?.[0]?.text, input);
  }

  private async generateWithOpenAI(input: GenerateContentInput): Promise<GeneratedContent> {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: this.buildPrompt(input) }],
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          Authorization: `Bearer ${input.aiApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return this.parseProviderResponse(response.data.choices?.[0]?.message?.content, input);
  }

  private async generateWithGemini(input: GenerateContentInput): Promise<GeneratedContent> {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${encodeURIComponent(input.aiApiKey)}`,
      {
        contents: [{ parts: [{ text: this.buildPrompt(input) }] }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return this.parseProviderResponse(
      response.data.candidates?.[0]?.content?.parts?.[0]?.text,
      input
    );
  }

  private parseProviderResponse(rawText: string | undefined, input: GenerateContentInput): GeneratedContent {
    if (!rawText) {
      return this.generateMockContent(input);
    }

    try {
      const parsed = JSON.parse(rawText);
      return {
        content: String(parsed.content || '').trim(),
        hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.map(String) : [],
        imagePrompt: parsed.imagePrompt ? String(parsed.imagePrompt) : undefined
      };
    } catch {
      return this.generateMockContent(input);
    }
  }

  private generateMockContent(input: GenerateContentInput): GeneratedContent {
    const normalizedPrompt = input.prompt.trim();
    const shortPrompt = normalizedPrompt.length > 220
      ? `${normalizedPrompt.slice(0, 217)}...`
      : normalizedPrompt;

    return {
      content: `[${input.aiProvider}] ${shortPrompt}\n\nGerado para o usuário ${input.userId}.`,
      hashtags: this.generateMockHashtags(shortPrompt, 5),
      imagePrompt: `Crie uma imagem para: ${shortPrompt}`,
      imageUrl: undefined
    };
  }

  private generateMockHashtags(topic: string, count: number): string[] {
    const words = topic
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, count);

    const generated = words.map((word) => `#${word.replace(/\s+/g, '')}`);

    while (generated.length < count) {
      generated.push(`#PostFlow${generated.length + 1}`);
    }

    return generated;
  }
}
