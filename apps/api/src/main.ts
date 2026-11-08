import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module.ts';
import { setupApp } from './app.setup.ts';

const PORT = 3000;

const app = setupApp(await NestFactory.create<NestExpressApplication>(AppModule.forRoot(), { rawBody: true }));
// A deployment stops the container with SIGTERM: close the job worker and connections instead of dying
// mid-job, so a running job finishes rather than waiting for its lock to expire.
app.enableShutdownHooks();
await app.listen(PORT);
