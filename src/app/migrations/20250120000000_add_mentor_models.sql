-- Create Mentor tables
-- This migration adds all Mentor AI Assistant related tables

-- MentorSubscription: Track Mentor feature subscriptions per company
CREATE TABLE IF NOT EXISTS "MentorSubscription" (
    "id" SERIAL PRIMARY KEY,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "MentorSubscription_userId_companyId_key" UNIQUE ("userId", "companyId"),
    CONSTRAINT "MentorSubscription_stripeSubscriptionId_key" UNIQUE ("stripeSubscriptionId")
);

CREATE INDEX IF NOT EXISTS "MentorSubscription_userId_idx" ON "MentorSubscription"("userId");
CREATE INDEX IF NOT EXISTS "MentorSubscription_companyId_idx" ON "MentorSubscription"("companyId");
CREATE INDEX IF NOT EXISTS "MentorSubscription_userId_status_idx" ON "MentorSubscription"("userId", "status");
CREATE INDEX IF NOT EXISTS "MentorSubscription_status_idx" ON "MentorSubscription"("status");

-- MentorConversation: Store conversation threads
CREATE TABLE IF NOT EXISTS "MentorConversation" (
    "id" SERIAL PRIMARY KEY,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS "MentorConversation_companyId_idx" ON "MentorConversation"("companyId");
CREATE INDEX IF NOT EXISTS "MentorConversation_userId_idx" ON "MentorConversation"("userId");
CREATE INDEX IF NOT EXISTS "MentorConversation_companyId_createdAt_idx" ON "MentorConversation"("companyId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "MentorConversation_companyId_isArchived_idx" ON "MentorConversation"("companyId", "isArchived");

-- MentorMessage: Individual messages in conversations
CREATE TABLE IF NOT EXISTS "MentorMessage" (
    "id" SERIAL PRIMARY KEY,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conversationId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "tokensUsed" INTEGER
);

CREATE INDEX IF NOT EXISTS "MentorMessage_conversationId_idx" ON "MentorMessage"("conversationId");
CREATE INDEX IF NOT EXISTS "MentorMessage_conversationId_createdAt_idx" ON "MentorMessage"("conversationId", "createdAt");

-- MentorKnowledgeIndex: Track what data has been indexed
CREATE TABLE IF NOT EXISTS "MentorKnowledgeIndex" (
    "id" SERIAL PRIMARY KEY,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER,
    "embedding" TEXT,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "lastIndexedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MentorKnowledgeIndex_companyId_entityType_entityId_key" UNIQUE ("companyId", "entityType", "entityId")
);

CREATE INDEX IF NOT EXISTS "MentorKnowledgeIndex_companyId_idx" ON "MentorKnowledgeIndex"("companyId");
CREATE INDEX IF NOT EXISTS "MentorKnowledgeIndex_companyId_entityType_idx" ON "MentorKnowledgeIndex"("companyId", "entityType");
CREATE INDEX IF NOT EXISTS "MentorKnowledgeIndex_entityType_entityId_idx" ON "MentorKnowledgeIndex"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "MentorKnowledgeIndex_lastIndexedAt_idx" ON "MentorKnowledgeIndex"("lastIndexedAt");

-- MentorConfig: Per-company AI preferences and settings
CREATE TABLE IF NOT EXISTS "MentorConfig" (
    "id" SERIAL PRIMARY KEY,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER NOT NULL UNIQUE,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "dataSources" JSONB,
    "piiMaskingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "piiMaskingRules" JSONB,
    "conversationRetention" INTEGER NOT NULL DEFAULT 90,
    "enableInternetSearch" BOOLEAN NOT NULL DEFAULT true,
    "enableProactiveAlerts" BOOLEAN NOT NULL DEFAULT true,
    "preferences" JSONB
);

CREATE INDEX IF NOT EXISTS "MentorConfig_companyId_idx" ON "MentorConfig"("companyId");

-- MentorGoal: Business goals set by users
CREATE TABLE IF NOT EXISTS "MentorGoal" (
    "id" SERIAL PRIMARY KEY,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetValue" DECIMAL,
    "currentValue" DECIMAL DEFAULT 0,
    "unit" TEXT,
    "targetDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "category" TEXT
);

CREATE INDEX IF NOT EXISTS "MentorGoal_companyId_idx" ON "MentorGoal"("companyId");
CREATE INDEX IF NOT EXISTS "MentorGoal_userId_idx" ON "MentorGoal"("userId");
CREATE INDEX IF NOT EXISTS "MentorGoal_companyId_status_idx" ON "MentorGoal"("companyId", "status");
CREATE INDEX IF NOT EXISTS "MentorGoal_companyId_createdAt_idx" ON "MentorGoal"("companyId", "createdAt" DESC);

-- MentorProgress: Progress tracking for goals
CREATE TABLE IF NOT EXISTS "MentorProgress" (
    "id" SERIAL PRIMARY KEY,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "goalId" INTEGER NOT NULL,
    "value" DECIMAL NOT NULL,
    "notes" TEXT
);

CREATE INDEX IF NOT EXISTS "MentorProgress_goalId_idx" ON "MentorProgress"("goalId");
CREATE INDEX IF NOT EXISTS "MentorProgress_goalId_createdAt_idx" ON "MentorProgress"("goalId", "createdAt" DESC);

-- MentorInsight: Generated insights and recommendations
CREATE TABLE IF NOT EXISTS "MentorInsight" (
    "id" SERIAL PRIMARY KEY,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" INTEGER NOT NULL,
    "insightType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "relatedEntityType" TEXT,
    "relatedEntityId" INTEGER
);

CREATE INDEX IF NOT EXISTS "MentorInsight_companyId_idx" ON "MentorInsight"("companyId");
CREATE INDEX IF NOT EXISTS "MentorInsight_companyId_isRead_isDismissed_idx" ON "MentorInsight"("companyId", "isRead", "isDismissed");
CREATE INDEX IF NOT EXISTS "MentorInsight_companyId_createdAt_idx" ON "MentorInsight"("companyId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "MentorInsight_insightType_idx" ON "MentorInsight"("insightType");

-- MentorReminder: Proactive reminders and alerts
CREATE TABLE IF NOT EXISTS "MentorReminder" (
    "id" SERIAL PRIMARY KEY,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER NOT NULL,
    "userId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "reminderType" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringRule" TEXT,
    "metadata" JSONB
);

CREATE INDEX IF NOT EXISTS "MentorReminder_companyId_idx" ON "MentorReminder"("companyId");
CREATE INDEX IF NOT EXISTS "MentorReminder_companyId_dueDate_idx" ON "MentorReminder"("companyId", "dueDate");
CREATE INDEX IF NOT EXISTS "MentorReminder_companyId_isCompleted_idx" ON "MentorReminder"("companyId", "isCompleted");
CREATE INDEX IF NOT EXISTS "MentorReminder_userId_idx" ON "MentorReminder"("userId");

-- Add foreign keys
ALTER TABLE "MentorSubscription" ADD CONSTRAINT "MentorSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MentorSubscription" ADD CONSTRAINT "MentorSubscription_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MentorConversation" ADD CONSTRAINT "MentorConversation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MentorConversation" ADD CONSTRAINT "MentorConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MentorMessage" ADD CONSTRAINT "MentorMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "MentorConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MentorKnowledgeIndex" ADD CONSTRAINT "MentorKnowledgeIndex_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MentorConfig" ADD CONSTRAINT "MentorConfig_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MentorGoal" ADD CONSTRAINT "MentorGoal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MentorGoal" ADD CONSTRAINT "MentorGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MentorProgress" ADD CONSTRAINT "MentorProgress_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "MentorGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MentorInsight" ADD CONSTRAINT "MentorInsight_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MentorReminder" ADD CONSTRAINT "MentorReminder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MentorReminder" ADD CONSTRAINT "MentorReminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

