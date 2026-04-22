import winston from 'winston'
import {
    CloudWatchLogsClient,
    CreateLogGroupCommand,
    CreateLogStreamCommand,
    PutLogEventsCommand,
    ResourceAlreadyExistsException
} from '@aws-sdk/client-cloudwatch-logs'
import { ILoggerRepository } from '@core/interfaces/logger.repository'



class CloudWatchTransport extends winston.transports.Stream {

    private readonly logGroupName: string
    private readonly logStreamName: string
    private readonly client: CloudWatchLogsClient

    constructor(logGroupName: string, logStreamName: string, client: CloudWatchLogsClient) {
        super()
        this.logGroupName = logGroupName
        this.logStreamName = logStreamName
        this.client = client
    }

    log(info: any, callback: () => void) {
        this.client.send(new PutLogEventsCommand({
            logGroupName: this.logGroupName,
            logStreamName: this.logStreamName,
            logEvents: [{ message: JSON.stringify(info), timestamp: Date.now() }]
        }))
            .then(() => callback())
            .catch(() => callback())
    }
}

export class LoggerWinstonCloudWatch implements ILoggerRepository {
    private readonly logger: winston.Logger
    private readonly client: CloudWatchLogsClient
    private readonly logGroupName: string
    private readonly logStreamName: string
    private initialized = false

    constructor(logGroupName: string) {
        this.logGroupName = logGroupName
        this.logStreamName = new Date().toISOString().split('T')[0]
        this.client = new CloudWatchLogsClient({ region: process.env.AWS_REGION })

        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.json(),
            transports: [
                new winston.transports.Console(),
                new CloudWatchTransport(this.logGroupName, this.logStreamName, this.client)
            ]
        })
    }

    async init(): Promise<void> {
        if (this.initialized) return  // evita reinicializar en warm starts
        try {
            await this.client.send(new CreateLogGroupCommand({ logGroupName: this.logGroupName }))
        } catch (e) {
            if (!(e instanceof ResourceAlreadyExistsException)) throw e
        }

        try {
            await this.client.send(new CreateLogStreamCommand({
                logGroupName: this.logGroupName,
                logStreamName: this.logStreamName
            }))
        } catch (e) {
            if (!(e instanceof ResourceAlreadyExistsException)) throw e
        }

        this.initialized = true
    }

    info(message: string, meta?: Record<string, unknown>) {
        this.logger.info(message, meta)
    }

    error(message: string, meta?: Record<string, unknown>) {
        this.logger.error(message, meta)
    }

    warn(message: string, meta?: Record<string, unknown>) {
        this.logger.warn(message, meta)
    }

    debug(message: string, meta?: Record<string, unknown>) {
        this.logger.debug(message, meta)
    }
}