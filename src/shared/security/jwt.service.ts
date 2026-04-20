import jwt from 'jsonwebtoken';

export interface AuthTokenPayload {
  userId: string;
}

const JWT_EXPIRES_IN = '7d';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is required');
  }

  return secret;
}

export class JwtService {
  static sign(payload: AuthTokenPayload): string {
    return jwt.sign(payload, getJwtSecret(), {
      algorithm: 'HS256',
      expiresIn: JWT_EXPIRES_IN
    });
  }

  static verify(token: string): AuthTokenPayload | null {
    try {
      const decoded = jwt.verify(token, getJwtSecret(), {
        algorithms: ['HS256']
      });

      if (!decoded || typeof decoded !== 'object' || typeof decoded.userId !== 'string') {
        return null;
      }

      return { userId: decoded.userId };
    } catch {
      return null;
    }
  }
}
