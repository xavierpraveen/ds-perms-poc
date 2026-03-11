import { Module } from '@nestjs/common';
import { ClerkGuard } from './clerk.guard';
import { ApiKeyGuard } from './api-key.guard';

@Module({
  providers: [ClerkGuard, ApiKeyGuard],
  exports: [ClerkGuard, ApiKeyGuard],
})
export class AuthModule {}
