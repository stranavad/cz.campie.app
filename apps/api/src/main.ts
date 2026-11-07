import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module.ts';
import { setupApp } from './app.setup.ts';

const PORT = 3000;

const app = setupApp(await NestFactory.create<NestExpressApplication>(AppModule.forRoot(), { rawBody: true }));
await app.listen(PORT);
