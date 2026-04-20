-- Migration: add-multi-user
-- Execute este SQL no banco de dados do Render (PostgreSQL)

-- 1. Criar enum de roles
DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Adicionar colunas na tabela User
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "role" "UserRole" NOT NULL DEFAULT 'USER',
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

-- 3. Criar tabela AdminSession
CREATE TABLE IF NOT EXISTS "AdminSession" (
  "id" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "targetUserId" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP(3),
  CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AdminSession_adminId_idx" ON "AdminSession"("adminId");
CREATE INDEX IF NOT EXISTS "AdminSession_targetUserId_idx" ON "AdminSession"("targetUserId");

-- 4. Tornar o admin master o primeiro usuário
-- Substitua o email abaixo pelo seu email de admin
UPDATE "User" SET "role" = 'ADMIN' WHERE "email" = 'nfe.jonas@gmail.com';
