import { NextFunction, Request, Response } from 'express';
import { JwtService } from '../../shared/security/jwt.service';
import { findUserById } from '../../shared/database/user.repository';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authorization = req.header('Authorization');

  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authorization.slice('Bearer '.length).trim();
  const payload = JwtService.verify(token);

  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await findUserById(payload.userId);

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.user = user;
  next();
}
