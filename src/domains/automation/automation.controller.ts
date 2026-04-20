import { Router } from 'express';
import { EncryptionService } from '../../shared/security/encryption.service';
import { ContentGeneratorService } from '../content/content-generator.service';
import { getNextRunAt } from '../../shared/scheduler/cron.utils';
import { contentGenQueue } from '../../shared/queue/bull.queue';
import { findAutomationConfigByUserId, saveAutomationConfig } from '../../shared/database/automation.repository';
import { AI_PROVIDERS, type AIProvider } from './automation.types';

const router = Router();
const contentGeneratorService = new ContentGeneratorService();

function serializeConfig(config: {
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
}) {
  const decryptedKey = EncryptionService.decrypt(config.aiApiKeyEncrypted);
  const visibleSuffix = decryptedKey.slice(-4);

  return {
    id: config.id,
    active: config.active,
    cronExpression: config.cronExpression,
    timezone: config.timezone,
    promptTemplate: config.promptTemplate,
    aiProvider: config.aiProvider,
    platforms: config.platforms,
    autoPublish: config.autoPublish,
    lastRunAt: config.lastRunAt,
    nextRunAt: config.nextRunAt,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
    hasAiApiKey: true,
    maskedAiApiKey: visibleSuffix ? `••••••${visibleSuffix}` : '••••••'
  };
}

router.get('/', async (req, res) => {
  try {
    const config = await findAutomationConfigByUserId(req.user!.id);

    res.json(config ? serializeConfig(config) : null);
  } catch (error) {
    console.error('Error fetching automation config:', error);
    res.status(500).json({ error: 'Failed to fetch automation config' });
  }
});

router.put('/', async (req, res) => {
  try {
    const active = Boolean(req.body.active);
    const cronExpression = String(req.body.cronExpression || '').trim();
    const timezone = String(req.body.timezone || '').trim() || 'America/Sao_Paulo';
    const promptTemplate = String(req.body.promptTemplate || '').trim();
    const aiProvider = String(req.body.aiProvider || '') as AIProvider;
    const aiApiKey = String(req.body.aiApiKey || '').trim();
    const platforms = Array.isArray(req.body.platforms)
      ? req.body.platforms.filter((platform: unknown): platform is string => typeof platform === 'string')
      : [];
    const autoPublish = req.body.autoPublish !== false;

    if (!cronExpression) {
      return res.status(400).json({ error: 'cronExpression é obrigatório' });
    }

    if (!promptTemplate) {
      return res.status(400).json({ error: 'promptTemplate é obrigatório' });
    }

    if (!AI_PROVIDERS.includes(aiProvider)) {
      return res.status(400).json({ error: 'aiProvider inválido' });
    }

    if (platforms.length === 0) {
      return res.status(400).json({ error: 'Selecione ao menos uma plataforma' });
    }

    const existing = await findAutomationConfigByUserId(req.user!.id);

    if (!existing && !aiApiKey) {
      return res.status(400).json({ error: 'aiApiKey é obrigatória na criação inicial' });
    }

    const encryptedApiKey = aiApiKey
      ? EncryptionService.encrypt(aiApiKey)
      : existing!.aiApiKeyEncrypted;

    const nextRunAt = active ? getNextRunAt(cronExpression, timezone) : null;

    const config = await saveAutomationConfig({
      userId: req.user!.id,
      active,
      cronExpression,
      timezone,
      promptTemplate,
      aiProvider,
      aiApiKeyEncrypted: encryptedApiKey,
      platforms,
      autoPublish,
      nextRunAt
    });

    res.json(serializeConfig(config));
  } catch (error) {
    console.error('Error saving automation config:', error);
    res.status(500).json({ error: 'Failed to save automation config' });
  }
});

router.post('/test', async (req, res) => {
  try {
    const config = await findAutomationConfigByUserId(req.user!.id);

    if (!config) {
      return res.status(404).json({ error: 'Automation config not found' });
    }

    const aiApiKey = EncryptionService.decrypt(config.aiApiKeyEncrypted);
    const preview = await contentGeneratorService.generate({
      userId: req.user!.id,
      prompt: config.promptTemplate,
      aiProvider: config.aiProvider,
      aiApiKey
    });

    res.json({
      previewText: preview.content,
      previewImageUrl: preview.imageUrl || null
    });
  } catch (error) {
    console.error('Error testing automation config:', error);
    res.status(500).json({ error: 'Failed to test automation config' });
  }
});

router.post('/run-now', async (req, res) => {
  try {
    const config = await findAutomationConfigByUserId(req.user!.id);

    if (!config) {
      return res.status(404).json({ error: 'Automation config not found' });
    }

    await contentGenQueue.add(
      { userId: req.user!.id, automationConfigId: config.id },
      { removeOnComplete: true, attempts: 3 }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error queueing automation run:', error);
    res.status(500).json({ error: 'Failed to queue automation run' });
  }
});

export const automationRoutes = router;
