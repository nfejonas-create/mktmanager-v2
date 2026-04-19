import axios from 'axios';
import { Platform } from '@prisma/client';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export class ContentGeneratorService {
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || '';
  }
  
  async generatePost(topic: string, platform: Platform, tone?: string): Promise<{
    content: string;
    hashtags: string[];
  }> {
    // For development with mock API key
    if (this.apiKey === 'mock_anthropic_key' || !this.apiKey) {
      return this.generateMockContent(topic, platform);
    }
    
    const platformGuidelines = this.getPlatformGuidelines(platform);
    const toneGuideline = tone || this.getDefaultTone(platform);
    
    const prompt = `Gere um post para ${platform} sobre o tema: "${topic}".

Diretrizes da plataforma:
${platformGuidelines}

Tom de voz: ${toneGuideline}

Requisitos:
- Texto envolvente e relevante
- Inclua 3-5 hashtags relevantes no final
- Formate para fácil leitura
- Inclua um call-to-action sutil

Responda em formato JSON:
{
  "content": "texto do post aqui",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"]
}`;

    try {
      const response = await axios.post(
        ANTHROPIC_API_URL,
        {
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
          }
        }
      );
      
      const content = response.data.content[0].text;
      const parsed = JSON.parse(content);
      
      return {
        content: parsed.content,
        hashtags: parsed.hashtags
      };
    } catch (error) {
      console.error('Error generating content:', error);
      return this.generateMockContent(topic, platform);
    }
  }
  
  async generateHashtags(topic: string, count: number = 5): Promise<string[]> {
    // For development with mock API key
    if (this.apiKey === 'mock_anthropic_key' || !this.apiKey) {
      return this.generateMockHashtags(topic, count);
    }
    
    const prompt = `Gere ${count} hashtags relevantes para o tema: "${topic}".
Responda apenas com um array JSON de strings.`;

    try {
      const response = await axios.post(
        ANTHROPIC_API_URL,
        {
          model: 'claude-3-sonnet-20240229',
          max_tokens: 200,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
          }
        }
      );
      
      const content = response.data.content[0].text;
      return JSON.parse(content);
    } catch (error) {
      console.error('Error generating hashtags:', error);
      return this.generateMockHashtags(topic, count);
    }
  }
  
  private getPlatformGuidelines(platform: Platform): string {
    switch (platform) {
      case 'LINKEDIN':
        return `- Profissional e formal
- Foque em insights e valor profissional
- Use parágrafos curtos
- Ideal: 100-300 palavras
- Inclua contexto de indústria quando relevante`;
      
      case 'FACEBOOK':
        return `- Tom mais casual e pessoal
- Perguntas e engajamento funcionam bem
- Use emojis moderadamente
- Ideal: 40-80 palavras
- Foque em comunidade e conversa`;
      
      default:
        return '- Tom neutro e informativo';
    }
  }
  
  private getDefaultTone(platform: Platform): string {
    switch (platform) {
      case 'LINKEDIN':
        return 'profissional, inspirador, educativo';
      case 'FACEBOOK':
        return 'amigável, conversacional, engajador';
      default:
        return 'neutro';
    }
  }
  
  private generateMockContent(topic: string, platform: Platform): {
    content: string;
    hashtags: string[];
  } {
    const templates = {
      LINKEDIN: [
        `Estou refletindo sobre ${topic} e como isso impacta nossa indústria. É fascinante ver como as tendências evoluem e criam novas oportunidades para inovação.

O que você tem observado sobre esse tema? Compartilhe sua perspectiva nos comentários. 👇`,
        
        `Dica profissional sobre ${topic}:

✅ Mantenha-se atualizado com as últimas tendências
✅ Conecte-se com profissionais da área
✅ Aplique o aprendizado em projetos práticos

A jornada do conhecimento é contínua. Qual sua experiência com esse tema?`
      ],
      FACEBOOK: [
        `Quem mais está pensando sobre ${topic}? 🤔

Acho incrível como esse assunto tem gerado tantas conversas interessantes ultimamente. O que você acha?

Deixe sua opinião nos comentários! 👇`,
        
        `Hoje estou compartilhando algo sobre ${topic} que pode te interessar! 😊

Às vezes as melhores ideias vêm quando menos esperamos. Você já teve uma experiência assim?`
      ]
    };
    
    const platformTemplates = templates[platform] || templates.LINKEDIN;
    const randomTemplate = platformTemplates[Math.floor(Math.random() * platformTemplates.length)];
    
    const hashtags = this.generateMockHashtags(topic, 5);
    
    return {
      content: randomTemplate,
      hashtags
    };
  }
  
  private generateMockHashtags(topic: string, count: number): string[] {
    const baseHashtags = [
      `#${topic.replace(/\s+/g, '')}`,
      '#Inovação',
      '#Crescimento',
      '#Sucesso',
      '#Dicas',
      '#Aprendizado',
      '#Desenvolvimento',
      '#Tendências',
      '#Networking',
      '#Profissional'
    ];
    
    return baseHashtags.slice(0, count);
  }
}