-- CreateEnum
CREATE TYPE "Environment" AS ENUM ('PRODUCTION', 'SANDBOX');

-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'DATE', 'JSON', 'ARRAY');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "environment" "Environment" NOT NULL DEFAULT 'PRODUCTION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_fields" (
    "id" UUID NOT NULL,
    "moduleId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "sensitive" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "module_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_records" (
    "id" UUID NOT NULL,
    "moduleId" UUID NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "environment" "Environment" NOT NULL DEFAULT 'PRODUCTION',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_key_module_permissions" (
    "id" UUID NOT NULL,
    "apiKeyId" UUID NOT NULL,
    "moduleId" UUID NOT NULL,
    "canRead" BOOLEAN NOT NULL DEFAULT false,
    "canCreate" BOOLEAN NOT NULL DEFAULT false,
    "canUpdate" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "api_key_module_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_key_field_permissions" (
    "id" UUID NOT NULL,
    "apiKeyId" UUID NOT NULL,
    "moduleFieldId" UUID NOT NULL,
    "allowed" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "api_key_field_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_logs" (
    "id" UUID NOT NULL,
    "apiKeyId" UUID NOT NULL,
    "method" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "requestPayload" JSONB,
    "responseBody" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "modules_userId_environment_idx" ON "modules"("userId", "environment");

-- CreateIndex
CREATE UNIQUE INDEX "modules_userId_slug_key" ON "modules"("userId", "slug");

-- CreateIndex
CREATE INDEX "module_fields_moduleId_idx" ON "module_fields"("moduleId");

-- CreateIndex
CREATE INDEX "module_records_moduleId_createdAt_idx" ON "module_records"("moduleId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "api_keys_keyHash_idx" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "api_keys_userId_idx" ON "api_keys"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "api_key_module_permissions_apiKeyId_moduleId_key" ON "api_key_module_permissions"("apiKeyId", "moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "api_key_field_permissions_apiKeyId_moduleFieldId_key" ON "api_key_field_permissions"("apiKeyId", "moduleFieldId");

-- CreateIndex
CREATE INDEX "request_logs_apiKeyId_createdAt_idx" ON "request_logs"("apiKeyId", "createdAt");

-- CreateIndex
CREATE INDEX "request_logs_createdAt_idx" ON "request_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_fields" ADD CONSTRAINT "module_fields_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_records" ADD CONSTRAINT "module_records_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_key_module_permissions" ADD CONSTRAINT "api_key_module_permissions_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "api_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_key_module_permissions" ADD CONSTRAINT "api_key_module_permissions_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_key_field_permissions" ADD CONSTRAINT "api_key_field_permissions_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "api_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_key_field_permissions" ADD CONSTRAINT "api_key_field_permissions_moduleFieldId_fkey" FOREIGN KEY ("moduleFieldId") REFERENCES "module_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_logs" ADD CONSTRAINT "request_logs_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "api_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
