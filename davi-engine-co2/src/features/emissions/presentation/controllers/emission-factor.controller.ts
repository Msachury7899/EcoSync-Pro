import { Request, Response } from 'express';
import { CustomResponse } from '@core/util/custom-response';
import { ValidatorBuilder } from '@core/util/validator-builder';
import type { ILoggerRepository } from '@core/interfaces/logger.repository';
import type { ICreateEmissionFactorUseCase, IGetEmissionFactorsUseCase, IGetEmissionFactorUseCase } from '../../domain/emissions.ports';
import { toEmissionFactorResponse } from '../../application/emissions.mappers';
import type { EmissionsValidatorSchemaMap } from '../validators/emissions.validators';

export class EmissionFactorController {
    constructor(
        private readonly validator: ValidatorBuilder<EmissionsValidatorSchemaMap>,
        private readonly createEmissionFactorUseCase: ICreateEmissionFactorUseCase,
        private readonly getEmissionFactorsUseCase: IGetEmissionFactorsUseCase,
        private readonly getEmissionFactorUseCase: IGetEmissionFactorUseCase,
        private readonly loggerService: ILoggerRepository,
    ) {}

    public store = async (req: Request, res: Response): Promise<void> => {
        this.loggerService.info('emission-factor.store', { action: 'start' });
        const validation = this.validator.safeValidate('CreateEmissionFactorDto', req.body);
        if (!validation.success) { CustomResponse.handleErrorValidations(validation.errors, res, this.loggerService); return; }

        const dto = { ...validation.data, effectiveFrom: new Date(validation.data.effectiveFrom) };

        this.createEmissionFactorUseCase
            .execute(dto)
            .then((result) => CustomResponse.successResponse({ res, data: toEmissionFactorResponse(result), statusCode: 201 }))
            .catch((error) => CustomResponse.handleError(error, res, this.loggerService));
    };

    public index = async (_req: Request, res: Response): Promise<void> => {
        this.loggerService.info('emission-factor.index', { action: 'start' });
        this.getEmissionFactorsUseCase
            .execute()
            .then((result) => CustomResponse.successResponse({ res, data: result.map(toEmissionFactorResponse) }))
            .catch((error) => CustomResponse.handleError(error, res, this.loggerService));
    };

    public show = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        this.loggerService.info('emission-factor.show', { action: 'start', id });
        const validation = this.validator.safeValidate('EmissionFactorIdDto', { id });
        if (!validation.success) { CustomResponse.handleErrorValidations(validation.errors, res, this.loggerService); return; }

        this.getEmissionFactorUseCase
            .execute(validation.data.id)
            .then((result) => CustomResponse.successResponse({ res, data: toEmissionFactorResponse(result) }))
            .catch((error) => CustomResponse.handleError(error, res, this.loggerService));
    };
}
