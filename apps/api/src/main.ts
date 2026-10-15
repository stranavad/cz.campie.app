import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.ts';
import { setupApp } from './app.setup.ts';

const PORT = 3000;

const app = setupApp(await NestFactory.create(AppModule));
await app.listen(PORT);
