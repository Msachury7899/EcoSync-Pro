import { Response } from 'express';
import { CustomError } from './custom-error';
import { ILoggerRepository } from '@core/interfaces/logger.repository';


interface SuccessOptions {
    res: Response;
    data: unknown;
    statusCode?: number;
}

export class CustomResponse {

    static successResponse({ res, data, statusCode = 200 }: SuccessOptions): void {
        res.status(statusCode).json({ state: true, data });
    }

    static handleError(error: unknown, res: Response, loggerRepository: ILoggerRepository | null = null): void {
        if (error instanceof CustomError) {
            if (loggerRepository) loggerRepository.error('http.request.error', { errors: [error.message] });
            res.status(error.statusCode).json({ state: false, errors: [error.message] });
            return;
        }

        if (loggerRepository) loggerRepository.error('http.request.error', { errors: ['Error interno del servidor'] });
        console.log(error)
        res.status(500).json({ state: false, errors: ['Error interno del servidor'] });
    }

    static handleErrorValidations = (errors: unknown, res: Response, loggerRepository: ILoggerRepository | null = null) => {
        if (loggerRepository) loggerRepository.error('http.request.error', { errors });
        return res.status(400).json({
            state: false,
            errors
        });
    }
}
