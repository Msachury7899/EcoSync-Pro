import { Router } from 'express';
import { db } from '@db/drizzle/client';
import { LoggerWinstonLocal } from '@core/config/adapters/logger.winston-local';
import { ValidatorBuilder } from '@core/util/validator-builder';
import { FuelTypeDrizzlePg } from '../../infraestructure/fuel-types/fuel-type.drizzle-pg';
import { CreateFuelTypeUseCase } from '../../application/fuel-types/create-fuel-type.use-case';
import { GetFuelTypesUseCase } from '../../application/fuel-types/get-fuel-types.use-case';
import { GetFuelTypeUseCase } from '../../application/fuel-types/get-fuel-type.use-case';
import { FuelTypeController } from '../controllers/fuel-type.controller';
import { schemaMapEmissions } from '../validators/emissions.validators';

export class FuelTypeRoutes {
    static get routes(): Router {
        const repo = new FuelTypeDrizzlePg(db);
        const loggerRepository = new LoggerWinstonLocal();
        const validator = new ValidatorBuilder(schemaMapEmissions);

        const controller = new FuelTypeController(
            validator,
            new CreateFuelTypeUseCase(repo, loggerRepository),
            new GetFuelTypesUseCase(repo, loggerRepository),
            new GetFuelTypeUseCase(repo, loggerRepository),
            loggerRepository,
        );

        const router = Router();
        router.post('/', controller.store);
        router.get('/', controller.index);
        router.get('/:id', controller.show);
        return router;
    }
}
