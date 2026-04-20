import { JwtService } from '../shared/security/jwt.service';
import { PasswordService } from '../shared/security/password.service';

var mockFindUserById = jest.fn();
var mockFindUserByEmail = jest.fn();
var mockCreateUser = jest.fn();

jest.mock('../shared/database/user.repository', () => ({
  findUserById: mockFindUserById,
  findUserByEmail: mockFindUserByEmail,
  createUser: mockCreateUser
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

jest.mock('../shared/queue/bull.queue', () => ({
  publishQueue: { add: jest.fn(), process: jest.fn(), on: jest.fn(), close: jest.fn() },
  contentGenQueue: { add: jest.fn(), process: jest.fn(), on: jest.fn(), close: jest.fn() }
}));

const request = require('supertest');
const app = require('../api/app').default;

describe('auth and ownership', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('register -> login -> /auth/me returns the correct user', async () => {
    const passwordHash = await PasswordService.hash('Password123');
    const createdUser = {
      id: 'user-1',
      email: 'user1@example.com',
      passwordHash,
      name: 'User One',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockFindUserByEmail.mockResolvedValueOnce(null).mockResolvedValueOnce(createdUser);
    mockCreateUser.mockResolvedValue(createdUser);
    mockFindUserById.mockResolvedValue(createdUser);

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User One', email: 'user1@example.com', password: 'Password123' })
      .expect(201);

    expect(registerResponse.body.user.email).toBe('user1@example.com');

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user1@example.com', password: 'Password123' })
      .expect(200);

    const meResponse = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginResponse.body.token}`)
      .expect(200);

    expect(meResponse.body).toEqual(
      expect.objectContaining({
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User One'
      })
    );
  });

  it('returns 401 for /accounts without a token', async () => {
    await request(app).get('/api/accounts').expect(401);
  });

  it('returns 404 when requesting a post owned by another user', async () => {
    mockFindUserById.mockResolvedValue({
      id: 'user-a',
      email: 'a@example.com',
      passwordHash: 'hash',
      name: 'User A',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    prismaMock.post.findUnique.mockResolvedValue({
      id: 'post-1',
      userId: 'user-b',
      socialAccountId: 'account-1',
      status: 'DRAFT'
    });

    const token = JwtService.sign({ userId: 'user-a' });

    await request(app)
      .get('/api/posts/post-1')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });
});
