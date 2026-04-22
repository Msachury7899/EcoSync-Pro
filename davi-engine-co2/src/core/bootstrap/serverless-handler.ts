import serverlessExpress from '@codegenie/serverless-express';
import type { Handler, Callback, Context } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';

import { AppRoutes } from '@core/config/routes/app-routes';
import { allServiceConfigs } from '@core/config/deploy/monolith';
import { Server } from '@core/config/server';
import { envs } from '@core/envs';

// Singleton global — reutilizado en warm starts
const prisma = new PrismaClient();

// App configurada sin listen()
const server = new Server({
    port: envs.PORT,
    routes: AppRoutes.buildMonolith(allServiceConfigs),
});
const app = server.getApp();

// Handler de Lambda — inicializado una vez fuera del closure
const serverlessHandler = serverlessExpress({ app });

export const handler: Handler = async (event: unknown, context: Context, callback: Callback) => {
    // Asegurar conexión Prisma antes de procesar (warm start)
    await prisma.$connect();
    return serverlessHandler(event, context, callback);
};
