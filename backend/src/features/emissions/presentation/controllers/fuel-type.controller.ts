import { Request, Response } from 'express';
import { CustomResponse } from '@core/util/custom-response';
import { ValidatorBuilder } from '@core/util/validator-builder';
import type { ILoggerRepository } from '@core/interfaces/logger.repository';
import type { ICreateFuelTypeUseCase, IGetFuelTypesUseCase, IGetFuelTypeUseCase } from '../../domain/emissions.ports';
import { toFuelTypeResponse } from '../../application/emissions.mappers';
import type { EmissionsValidatorSchemaMap } from '../validators/emissions.validators';

export class FuelTypeController {
    constructor(
        private readonly validator: ValidatorBuilder<EmissionsValidatorSchemaMap>,
        private readonly createFuelTypeUseCase: ICreateFuelTypeUseCase,
        private readonly getFuelTypesUseCase: IGetFuelTypesUseCase,
        private readonly getFuelTypeUseCase: IGetFuelTypeUseCase,
        private readonly loggerService: ILoggerRepository,
    ) {}

    public store = async (req: Request, res: Response): Promise<void> => {
        this.loggerService.info('fuel-type.store', { action: 'start' });
        const validation = this.validator.safeValidate('CreateFuelTypeDto', req.body);
        if (!validation.success) { CustomResponse.handleErrorValidations(validation.errors, res, this.loggerService); return; }

        this.createFuelTypeUseCase
            .execute(validation.data)
            .then((result) => CustomResponse.successResponse({ res, data: toFuelTypeResponse(result), statusCode: 201 }))
            .catch((error) => CustomResponse.handleError(error, res, this.loggerService));
    };

    public index = async (_req: Request, res: Response): Promise<void> => {
        this.loggerService.info('fuel-type.index', { action: 'start' });
        this.getFuelTypesUseCase
            .execute()
            .then((result) => CustomResponse.successResponse({ res, data: result.map(toFuelTypeResponse) }))
            .catch((error) => CustomResponse.handleError(error, res, this.loggerService));
    };

    public show = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        this.loggerService.info('fuel-type.show', { action: 'start', id });
        const validation = this.validator.safeValidate('FuelTypeIdDto', { id });
        if (!validation.success) { CustomResponse.handleErrorValidations(validation.errors, res, this.loggerService); return; }

        this.getFuelTypeUseCase
            .execute(validation.data.id)
            .then((result) => CustomResponse.successResponse({ res, data: toFuelTypeResponse(result) }))
            .catch((error) => CustomResponse.handleError(error, res, this.loggerService));
    };
}
