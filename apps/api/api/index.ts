import 'reflect-metadata';
import type { Request, Response } from 'express';

// Wrap entire module init in a safe lazy-load pattern so
// top-level import errors surface as JSON 500s instead of crashing the worker.
let _bootstrapPromise: Promise<(req: Request, res: Response) => void> | null = null;

function getBootstrap() {
  if (_bootstrapPromise) return _bootstrapPromise;

  _bootstrapPromise = (async () => {
    // Lazy imports so any require/import errors are caught by the try in handler
    const { NestFactory } = await import('@nestjs/core');
    const { ValidationPipe } = await import('@nestjs/common');
    const { ExpressAdapter } = await import('@nestjs/platform-express');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const express = require('express');
    const { AppModule } = await import('../src/app.module');

    const expressServer = express();

    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressServer), {
      logger: ['error', 'warn'],
    });

    app.setGlobalPrefix('api');

    app.enableCors({
      origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'],
      credentials: true,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();
    return expressServer as (req: Request, res: Response) => void;
  })();

  return _bootstrapPromise;
}

export default async function handler(req: Request, res: Response) {
  try {
    const app = await getBootstrap();
    app(req, res);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error('[DMDS] Handler error:', message, stack);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ error: 'Internal Server Error', message, stack });
    }
  }
}
