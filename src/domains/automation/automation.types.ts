export const AI_PROVIDERS = ['OPENAI', 'ANTHROPIC', 'GEMINI'] as const;

export type AIProvider = (typeof AI_PROVIDERS)[number];

export interface AutomationConfigRecord {
  id: string;
  userId: string;
  active: boolean;
  cronExpression: string;
  timezone: string;
  promptTemplate: string;
  aiProvider: AIProvider;
  aiApiKeyEncrypted: string;
  platforms: string[];
  autoPublish: boolean;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
