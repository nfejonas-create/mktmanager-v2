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

  if (!user.isActive) {
    return res.status(403).json({ error: 'Conta desativada' });
  }

  req.user = user;

  // Verificar impersonação (apenas ADMIN pode)
  const impersonateUserId = req.header('X-Impersonate-User-Id');

  if (impersonateUserId && user.role === 'ADMIN') {
    const targetUser = await findUserById(impersonateUserId);
    if (!targetUser) {
      return res.status(400).json({ error: 'Usuário alvo não encontrado' });
    }
    if (!targetUser.isActive) {
      return res.status(400).json({ error: 'Usuário alvo está inativo' });
    }
    req.impersonatedUser = targetUser;
    req.effectiveUserId = targetUser.id;
  } else {
    req.effectiveUserId = user.id;
  }

  next();
}
