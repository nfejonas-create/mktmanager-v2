import { Router } from 'express';
import { requireAuth } from '../../api/middleware/auth.middleware';
import { requireAdmin } from '../../api/middleware/admin.middleware';
import {
  findAllUsers,
  createUser,
  updateUser,
  softDeleteUser,
  countAdmins,
  findUserByEmail
} from '../../shared/database/user.repository';
import { PasswordService } from '../../shared/security/password.service';
import { prisma } from '../../shared/database/prisma.client';

const router = Router();

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeUser(user: {
  id: string;
  email: unknown;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    email: String(user.email),
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

// LISTAR TODOS OS USUÁRIOS COM STATS
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await findAllUsers();

    // Buscar contagens de posts e contas sociais para cada usuário
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const [postCount, accountCount] = await Promise.all([
          prisma.$queryRawUnsafe<[{ count: string }]>(
            'SELECT COUNT(*) as count FROM "Post" WHERE "userId" = $1', user.id
          ),
          prisma.$queryRawUnsafe<[{ count: string }]>(
            'SELECT COUNT(*) as count FROM "SocialAccount" WHERE "userId" = $1', user.id
          )
        ]);

        return {
          ...sanitizeUser(user),
          _count: {
            posts: parseInt(postCount[0].count, 10),
            socialAccounts: parseInt(accountCount[0].count, 10)
          }
        };
      })
    );

    return res.json({ users: usersWithStats });
  } catch (error) {
    console.error('Error listing users:', error);
    return res.status(500).json({ error: 'Falha ao listar usuários' });
  }
});

// CRIAR NOVO USUÁRIO
router.post('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
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

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    const passwordHash = await PasswordService.hash(password);
    const user = await createUser({ name, email, passwordHash, role });

    return res.status(201).json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Falha ao criar usuário' });
  }
});

// ATUALIZAR USUÁRIO
router.patch('/users/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Proteger: não deixar admin remover role de si mesmo
    if (id === req.user!.id && req.body.role && req.body.role !== 'ADMIN') {
      return res.status(400).json({ error: 'Não é possível remover seu próprio acesso de admin' });
    }

    const updateData: { name?: string; email?: string; isActive?: boolean; role?: string } = {};
    if (req.body.name) updateData.name = String(req.body.name).trim();
    if (req.body.email) updateData.email = String(req.body.email).trim().toLowerCase();
    if (typeof req.body.isActive === 'boolean') updateData.isActive = req.body.isActive;
    if (req.body.role) updateData.role = req.body.role === 'ADMIN' ? 'ADMIN' : 'USER';

    const user = await updateUser(id, updateData);

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Falha ao atualizar usuário' });
  }
});

// DESATIVAR USUÁRIO (soft delete)
router.delete('/users/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user!.id) {
      return res.status(400).json({ error: 'Não é possível desativar sua própria conta' });
    }

    // Proteger: não desativar se for o único admin
    const adminCount = await countAdmins();
    const users = await findAllUsers();
    const targetUser = users.find(u => u.id === id);

    if (targetUser?.role === 'ADMIN' && adminCount <= 1) {
      return res.status(400).json({ error: 'Não é possível desativar o único administrador' });
    }

    await softDeleteUser(id);

    return res.json({ message: 'Usuário desativado com sucesso' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ error: 'Falha ao desativar usuário' });
  }
});

export const adminUserRoutes = router;
