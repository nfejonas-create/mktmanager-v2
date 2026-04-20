import { EncryptionService } from '../shared/security/encryption.service';

var mockFindUserById = jest.fn();

const automationStore = new Map<string, any>();

var mockFindAutomationConfigByUserId = jest.fn((userId: string) => Promise.resolve(automationStore.get(userId) || null));
var mockFindAutomationConfigByIdAndUserId = jest.fn((id: string, userId: string) =>
  Promise.resolve(automationStore.get(userId)?.id === id ? automationStore.get(userId) : null)
);
var mockSaveAutomationConfig = jest.fn(async (input: any) => {
  const next = {
    id: automationStore.get(input.userId)?.id || `automation-${input.userId}`,
    userId: input.userId,
    lastRunAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...input
  };
  automationStore.set(input.userId, next);
  return next;
});
var mockListDueAutomationConfigs = jest.fn(async () =>
  Array.from(automationStore.values())
    .filter((item) => item.active)
    .map((item) => ({ id: item.id, userId: item.userId, cronExpression: item.cronExpression, timezone: item.timezone }))
);
var mockMarkAutomationRun = jest.fn(async ({ userId, lastRunAt, nextRunAt }: any) => {
  const current = automationStore.get(userId);
  if (current) {
    automationStore.set(userId, { ...current, lastRunAt, nextRunAt });
  }
});

jest.mock('../shared/database/user.repository', () => ({
  findUserById: mockFindUserById,
  findUserByEmail: jest.fn(),
  createUser: jest.fn()
}));

jest.mock('../shared/database/automation.repository', () => ({
  findAutomationConfigByUserId: mockFindAutomationConfigByUserId,
  findAutomationConfigByIdAndUserId: mockFindAutomationConfigByIdAndUserId,
  saveAutomationConfig: mockSaveAutomationConfig,
  listDueAutomationConfigs: mockListDueAutomationConfigs,
  markAutomationRun: mockMarkAutomationRun
}));

var addPublishJob = jest.fn();
var addContentJob = jest.fn();

jest.mock('../shared/queue/bull.queue', () => ({
  publishQueue: { add: (...args: unknown[]) => addPublishJob(...args), process: jest.fn(), on: jest.fn(), close: jest.fn() },
  contentGenQueue: { add: (...args: unknown[]) => addContentJob(...args), process: jest.fn(), on: jest.fn(), close: jest.fn() }
}));

var prismaMock = {
  socialAccount: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    findUnique: jest.fn()
  },
  post: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    delete: jest.fn()
  },
  accountMetric: {
    findFirst: jest.fn(),
    create: jest.fn()
  },
  $queryRawUnsafe: jest.fn(),
  $executeRawUnsafe: jest.fn(),
  $disconnect: jest.fn()
};

jest.mock('../shared/database/prisma.client', () => ({
  prisma: prismaMock
}));

const request = require('supertest');
const app = require('../api/app').default;
const { processContentGenerationJob } = require('../workers/content-generator.worker');

describe('automation isolation', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    automationStore.clear();

    mockFindUserById.mockImplementation(async (id: string) => ({
      id,
      email: `${id}@example.com`,
      passwordHash: 'hash',
      name: id,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  });

  it('keeps automation config isolated per user on PUT /automation', async () => {
    const tokenA = require('../shared/security/jwt.service').JwtService.sign({ userId: 'user-a' });
    const tokenB = require('../shared/security/jwt.service').JwtService.sign({ userId: 'user-b' });

    await request(app)
      .put('/api/automation')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        active: true,
        cronExpression: '0 9 * * *',
        timezone: 'America/Sao_Paulo',
        promptTemplate: 'Prompt A',
        aiProvider: 'ANTHROPIC',
        aiApiKey: 'mock_key_a',
        platforms: ['LINKEDIN'],
        autoPublish: true
      })
      .expect(200);

    await request(app)
      .put('/api/automation')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        active: true,
        cronExpression: '0 18 * * *',
        timezone: 'America/Sao_Paulo',
        promptTemplate: 'Prompt B',
        aiProvider: 'OPENAI',
        aiApiKey: 'mock_key_b',
        platforms: ['FACEBOOK'],
        autoPublish: false
      })
      .expect(200);

    expect(automationStore.get('user-a').promptTemplate).toBe('Prompt A');
    expect(automationStore.get('user-b').promptTemplate).toBe('Prompt B');
    expect(automationStore.get('user-a').platforms).toEqual(['LINKEDIN']);
    expect(automationStore.get('user-b').platforms).toEqual(['FACEBOOK']);
  });

  it('runs two active users in parallel without prompt crossover', async () => {
    automationStore.set('user-a', {
      id: 'cfg-a',
      userId: 'user-a',
      active: true,
      cronExpression: '0 9 * * *',
      timezone: 'America/Sao_Paulo',
      promptTemplate: 'Prompt exclusivo A',
      aiProvider: 'ANTHROPIC',
      aiApiKeyEncrypted: EncryptionService.encrypt('mock_key_a'),
      platforms: ['LINKEDIN'],
      autoPublish: false,
      lastRunAt: null,
      nextRunAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    automationStore.set('user-b', {
      id: 'cfg-b',
      userId: 'user-b',
      active: true,
      cronExpression: '0 9 * * *',
      timezone: 'America/Sao_Paulo',
      promptTemplate: 'Prompt exclusivo B',
      aiProvider: 'OPENAI',
      aiApiKeyEncrypted: EncryptionService.encrypt('mock_key_b'),
      platforms: ['FACEBOOK'],
      autoPublish: false,
      lastRunAt: null,
      nextRunAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    prismaMock.socialAccount.findMany
      .mockResolvedValueOnce([{ id: 'linkedin-a', platform: 'LINKEDIN' }])
      .mockResolvedValueOnce([{ id: 'facebook-b', platform: 'FACEBOOK' }]);

    const createdPosts: any[] = [];
    prismaMock.post.create.mockImplementation(async ({ data }: any) => {
      const post = { id: `post-${createdPosts.length + 1}`, ...data };
      createdPosts.push(post);
      return post;
    });

    await Promise.all([
      processContentGenerationJob({ data: { userId: 'user-a', automationConfigId: 'cfg-a' } }),
      processContentGenerationJob({ data: { userId: 'user-b', automationConfigId: 'cfg-b' } })
    ]);

    expect(createdPosts).toHaveLength(2);
    expect(createdPosts[0].userId).toBe('user-a');
    expect(createdPosts[1].userId).toBe('user-b');
    expect(createdPosts[0].content).toContain('Prompt exclusivo A');
    expect(createdPosts[1].content).toContain('Prompt exclusivo B');
  });
});
