import { ILoggerRepository } from "@core/interfaces/logger.repository"
import { getCorrelationId } from "@core/util/correlation-id.util"
import winston from "winston"

export class LoggerWinstonLocal implements ILoggerRepository {
    private readonly logger: winston.Logger

    constructor() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.json(),
            transports: [
                new winston.transports.Console(),
            ]
        })
    }


    info(message: string, meta?: Record<string, unknown>) {

        this.logger.info(message, { ...meta, correlationId: getCorrelationId() })
    }

    error(message: string, meta?: Record<string, unknown>) {
        this.logger.error(message, { ...meta, correlationId: getCorrelationId() })
    }

    warn(message: string, meta?: Record<string, unknown>) {
        this.logger.warn(message, { ...meta, correlationId: getCorrelationId() })
    }

    debug(message: string, meta?: Record<string, unknown>) {

        this.logger.debug(message, { ...meta, correlationId: getCorrelationId() })
    }
}