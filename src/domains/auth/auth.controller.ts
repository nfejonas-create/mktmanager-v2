import { Router } from 'express';
import { requireAuth } from '../../api/middleware/auth.middleware';
import {
  createUser,
  findUserByEmail,
  findUserById,
  findAllUsers
} from '../../shared/database/user.repository';
import { PasswordService } from '../../shared/security/password.service';
import { JwtService } from '../../shared/security/jwt.service';
import { ImpersonationService } from '../../shared/services/impersonation.service';

const router = Router();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitizeUser(user: any) {
  return {
    id: user.id,
    email: String(user.email),
    name: user.name,
    role: String(user.role),
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// REGISTRO - apenas admin pode criar usuários
router.post('/register', requireAuth, async (req, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Apenas administradores podem criar usuários' });
    }

    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const role = req.body.role === 'ADMIN' ? 'ADMIN' : 'USER';

    if (name.length < 2) {
      return res.status(400).json({ error: 'Nome deve ter pelo menos 2 caracteres' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Já existe uma conta com esse email' });
    }

    const passwordHash = await PasswordService.hash(password);
    const user = await createUser({ name, email, passwordHash, role });

    return res.status(201).json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({ error: 'Falha ao criar usuário' });
  }
});

// LOGIN
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
    if (!user.isActive) {
      return res.status(403).json({ error: 'Conta desativada' });
    }

    const sanitizedUser = sanitizeUser(user);

    // Admin recebe lista de todos os usuários
    let users: ReturnType<typeof sanitizeUser>[] = [];
    if (user.role === 'ADMIN') {
      const allUsers = await findAllUsers();
      users = allUsers.map(sanitizeUser);
    }

    return res.json({
      token: JwtService.sign({ userId: sanitizedUser.id }),
      user: sanitizedUser,
      users
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    return res.status(500).json({ error: 'Falha ao fazer login' });
  }
});

// ME - retorna usuário atual + contexto de impersonação
router.get('/me', requireAuth, async (req, res) => {
  let users: ReturnType<typeof sanitizeUser>[] = [];
  if (req.user?.role === 'ADMIN') {
    const allUsers = await findAllUsers();
    users = allUsers.map(sanitizeUser);
  }

  return res.json({
    user: sanitizeUser(req.user!),
    effectiveUser: req.impersonatedUser ? sanitizeUser(req.impersonatedUser) : null,
    isAdminMode: !!req.impersonatedUser,
    users
  });
});

// IMPERSONATE - admin assume identidade de outro usuário
router.post('/impersonate', requireAuth, async (req, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Apenas administradores podem impersonar usuários' });
    }

    const { targetUserId } = req.body;
    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId é obrigatório' });
    }

    const targetUser = await findUserById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    if (!targetUser.isActive) {
      return res.status(400).json({ error: 'Usuário está inativo' });
    }

    await ImpersonationService.startSession(req.user.id, targetUserId);

    return res.json({
      targetUser: sanitizeUser(targetUser),
      message: 'Impersonação iniciada com sucesso'
    });
  } catch (error) {
    console.error('Error impersonating:', error);
    return res.status(500).json({ error: 'Falha ao iniciar impersonação' });
  }
});

// STOP IMPERSONATING
router.post('/stop-impersonating', requireAuth, async (req, res) => {
  try {
    await ImpersonationService.endAllSessions(req.user!.id);
    return res.json({ message: 'Impersonação encerrada' });
  } catch (error) {
    console.error('Error stopping impersonation:', error);
    return res.status(500).json({ error: 'Falha ao encerrar impersonação' });
  }
});

export const authRoutes = router;
