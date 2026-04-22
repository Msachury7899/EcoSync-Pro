import { Router } from 'express';
import { db } from '@db/drizzle/client';
import { LoggerWinstonLocal } from '@core/config/adapters/logger.winston-local';
import { ValidatorBuilder } from '@core/util/validator-builder';
import { EmissionRecordDrizzlePg } from '../../infraestructure/emission-records/emission-record.drizzle-pg';
import { EmissionFactorDrizzlePg } from '../../infraestructure/emission-factors/emission-factor.drizzle-pg';
import { CreateEmissionRecordUseCase } from '../../application/emission-records/create-emission-record.use-case';
import { GetEmissionRecordsUseCase } from '../../application/emission-records/get-emission-records.use-case';
import { GetEmissionRecordUseCase } from '../../application/emission-records/get-emission-record.use-case';
import { AuditEmissionRecordUseCase } from '../../application/emission-records/audit-emission-record.use-case';
import { GetEmissionRecordHistoryUseCase } from '../../application/emission-records/get-emission-record-history.use-case';
import { EmissionRecordController } from '../controllers/emission-record.controller';
import { schemaMapEmissions } from '../validators/emissions.validators';

export class EmissionRecordRoutes {
    static get routes(): Router {
        const repo = new EmissionRecordDrizzlePg(db);
        const factorRepo = new EmissionFactorDrizzlePg(db);
        const loggerRepository = new LoggerWinstonLocal();
        const validator = new ValidatorBuilder(schemaMapEmissions);

        const controller = new EmissionRecordController(
            validator,
            new CreateEmissionRecordUseCase(repo, factorRepo, loggerRepository),
            new GetEmissionRecordsUseCase(repo, loggerRepository),
            new GetEmissionRecordUseCase(repo, loggerRepository),
            new AuditEmissionRecordUseCase(repo, loggerRepository),
            new GetEmissionRecordHistoryUseCase(repo, loggerRepository),
            loggerRepository,
        );

        const router = Router();
        router.post('/', controller.store);
        router.get('/', controller.index);
        router.get('/:id', controller.show);
        router.patch('/:id/audit', controller.audit);
        router.get('/:id/history', controller.history);
        return router;
    }
}
