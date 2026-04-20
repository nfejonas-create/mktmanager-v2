import { Router } from 'express';
import { requireAuth } from '../../api/middleware/auth.middleware';
import { createUser, findUserByEmail } from '../../shared/database/user.repository';
import { PasswordService } from '../../shared/security/password.service';
import { JwtService } from '../../shared/security/jwt.service';

const router = Router();

function sanitizeUser(user: { id: string; email: unknown; name: string; createdAt: Date; updatedAt: Date }) {
  return {
    id: user.id,
    email: String(user.email),
    name: user.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post('/register', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (name.length < 2) {
      return res.status(400).json({ error: 'Nome deve ter pelo menos 2 caracteres' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 8 caracteres' });
    }

    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return res.status(409).json({ error: 'Já existe uma conta com esse email' });
    }

    const passwordHash = await PasswordService.hash(password);
    const user = await createUser({
      name,
      email,
      passwordHash
    });

    const sanitizedUser = sanitizeUser(user);

    return res.status(201).json({
      token: JwtService.sign({ userId: sanitizedUser.id }),
      user: sanitizedUser
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({ error: 'Failed to register user' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Senha é obrigatória' });
    }

    const user = await findUserByEmail(email);

    if (!user || !(await PasswordService.verify(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const sanitizedUser = sanitizeUser(user);

    return res.json({
      token: JwtService.sign({ userId: sanitizedUser.id }),
      user: sanitizedUser
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    return res.status(500).json({ error: 'Failed to login' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  return res.json(req.user);
});

export const authRoutes = router;
