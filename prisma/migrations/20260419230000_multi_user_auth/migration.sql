CREATE EXTENSION IF NOT EXISTS citext;

CREATE TYPE "AIProvider" AS ENUM ('OPENAI', 'ANTHROPIC', 'GEMINI');

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" CITEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "AutomationConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "cronExpression" TEXT NOT NULL DEFAULT '0 9 * * *',
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "promptTemplate" TEXT NOT NULL,
    "aiProvider" "AIProvider" NOT NULL,
    "aiApiKeyEncrypted" TEXT NOT NULL,
    "platforms" TEXT[],
    "autoPublish" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutomationConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AutomationConfig_userId_key" ON "AutomationConfig"("userId");

INSERT INTO "User" ("id", "email", "passwordHash", "name", "createdAt", "updatedAt")
VALUES (
    'default',
    'legacy@postflow.local',
    '$2b$12$KIXQOVpEh6QqQk0rGZWl3OtIh0b07XHtcwPa5grPLXnw0lPwQBGjS',
    'Legacy User',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;

ALTER TABLE "SocialAccount" ALTER COLUMN "userId" DROP DEFAULT;
ALTER TABLE "Post" ALTER COLUMN "userId" DROP DEFAULT;

ALTER TABLE "SocialAccount"
ADD CONSTRAINT "SocialAccount_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Post"
ADD CONSTRAINT "Post_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AutomationConfig"
ADD CONSTRAINT "AutomationConfig_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
