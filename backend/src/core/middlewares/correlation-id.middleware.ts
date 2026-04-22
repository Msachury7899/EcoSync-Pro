// correlation-id.middleware.ts
import { asyncLocalStorage, CORRELATION_ID_KEY } from '@core/config/storage/correlation-id.storage';
import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';


export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction) {
    const extractHeader = (header: string | string[] | undefined): string | undefined => {
        if (!header) return undefined;
        return Array.isArray(header) ? header[0] : header;
    };

    const correlationId =
        extractHeader(req.headers['x-correlation-id']) || // 1. Enviado explícitamente por otro microservicio
        extractHeader(req.headers['x-amzn-trace-id']) ||  // 2. Número mágico de AWS (API Gateway / Load Balancer)
        extractHeader(req.headers['x-aws-request-id']) || // 3. Alternate request ID de AWS serverless
        uuidv4();                                         // 4. Fallback autogenerado (ej. dev local)

    const store = new Map();
    store.set(CORRELATION_ID_KEY, correlationId);

    asyncLocalStorage.run(store, () => {
        res.setHeader('x-correlation-id', correlationId);
        next();
    });
}