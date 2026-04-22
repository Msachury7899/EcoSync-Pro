import { NextFunction, Request, Response } from 'express';
import { LoggerWinstonLocal } from '@core/config/adapters/logger.winston-local';

const logger = new LoggerWinstonLocal();

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime.bigint();

    logger.info('http.request.incoming', {
        request: {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            requestSize: req.headers['content-length'] || 0,
        }
        //userAgent: req.headers['user-agent']
    });

    res.on('finish', () => {
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1_000_000;
        const responseSizeInBytes = Number(res.get('Content-Length') || 0);
        const responseSizeKb = Number((responseSizeInBytes / 1024).toFixed(2));
        
        // Memoria del heap usada en Megabytes
        const memoryUsageMb = Number((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2));

        logger.info('http.request.completed', {
            response: {
                url: req.originalUrl,
                durationMs: Number(durationMs.toFixed(2)),
                responseSizeInKb: Number(responseSizeKb),
                memoryUsageMb: memoryUsageMb,
            }
        });
    });

    next();
}
