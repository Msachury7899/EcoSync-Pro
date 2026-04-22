import { Router } from 'express';
import { db } from '@db/drizzle/client';
import { LoggerWinstonLocal } from '@core/config/adapters/logger.winston-local';
import { ValidatorBuilder } from '@core/util/validator-builder';
import { EmissionFactorDrizzlePg } from '../../infraestructure/emission-factors/emission-factor.drizzle-pg';
import { CreateEmissionFactorUseCase } from '../../application/emission-factors/create-emission-factor.use-case';
import { GetEmissionFactorsUseCase } from '../../application/emission-factors/get-emission-factors.use-case';
import { GetEmissionFactorUseCase } from '../../application/emission-factors/get-emission-factor.use-case';
import { EmissionFactorController } from '../controllers/emission-factor.controller';
import { schemaMapEmissions } from '../validators/emissions.validators';

export class EmissionFactorRoutes {
    static get routes(): Router {
        const repo = new EmissionFactorDrizzlePg(db);
        const loggerRepository = new LoggerWinstonLocal();
        const validator = new ValidatorBuilder(schemaMapEmissions);

        const controller = new EmissionFactorController(
            validator,
            new CreateEmissionFactorUseCase(repo, loggerRepository),
            new GetEmissionFactorsUseCase(repo, loggerRepository),
            new GetEmissionFactorUseCase(repo, loggerRepository),
            loggerRepository,
        );

        const router = Router();
        router.post('/', controller.store);
        router.get('/', controller.index);
        router.get('/:id', controller.show);
        return router;
    }
}
