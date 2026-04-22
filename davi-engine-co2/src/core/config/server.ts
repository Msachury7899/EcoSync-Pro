import express, { Router } from 'express';
import http from 'http';
import path from 'path';

import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';

import { envs } from '@core/envs';


interface Options {
    port: number;
    routes: Router;
    swaggerSpec?: object;
}

export class Server {
    public readonly app = express();
    private serverListener?: http.Server;
    private readonly port: number;
    private readonly routes: Router;
    private readonly swaggerSpec?: object;
    private configured = false;

    constructor(options: Options) {
        const { port, routes, swaggerSpec } = options;
        this.port = port;
        this.routes = routes;
        this.swaggerSpec = swaggerSpec;
    }

    private configure(): void {
        if (this.configured) return;
        this.configured = true;

        // * Middlewares
        this.app.use(cors({
            origin: envs.CORS_ORIGINS,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        }));
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));// x-www-form-urlencoded
        this.app.use(compression());
        this.app.use(helmet.xssFilter());
        this.app.use(helmet.noSniff());
        this.app.use(helmet.hidePoweredBy());
        this.app.use(helmet.frameguard({ action: 'deny' }));
        // * Routes
        this.app.use(this.routes);

        // * Swagger UI (opcional, solo si se provee swaggerSpec)
        if (this.swaggerSpec) {
            // Lazy require para evitar incluir swagger en builds de producción
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const swaggerUiModule = require('swagger-ui-express');
            const swaggerUi = (swaggerUiModule.default ?? swaggerUiModule) as typeof import('swagger-ui-express');
            this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(this.swaggerSpec, {
                customSiteTitle: 'Retos AI - API Docs',
            }));
            console.log('http://localhost:' + this.port + '/api-docs');
        }
    }

    async start(): Promise<void> {
        console.log('server running');
        this.configure();
        this.serverListener = this.app.listen(this.port, () => {
            console.log('Server on running ' + this.port);
            console.log('http://localhost:' + this.port);
        });
    }

    public getApp(): express.Application {
        this.configure();
        return this.app;
    }

    public close(): void {
        this.serverListener?.close();
    }
}