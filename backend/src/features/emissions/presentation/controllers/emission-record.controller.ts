import { Request, Response } from 'express';
import { CustomResponse } from '@core/util/custom-response';
import { ValidatorBuilder } from '@core/util/validator-builder';
import type { ILoggerRepository } from '@core/interfaces/logger.repository';
import type {
    ICreateEmissionRecordUseCase,
    IGetEmissionRecordsUseCase,
    IGetEmissionRecordUseCase,
    IAuditEmissionRecordUseCase,
    IGetEmissionRecordHistoryUseCase,
} from '../../domain/emissions.ports';
import { toEmissionRecordResponse, toEmissionRecordHistoryResponse } from '../../application/emissions.mappers';
import type { EmissionsValidatorSchemaMap } from '../validators/emissions.validators';

export class EmissionRecordController {
    constructor(
        private readonly validator: ValidatorBuilder<EmissionsValidatorSchemaMap>,
        private readonly createEmissionRecordUseCase: ICreateEmissionRecordUseCase,
        private readonly getEmissionRecordsUseCase: IGetEmissionRecordsUseCase,
        private readonly getEmissionRecordUseCase: IGetEmissionRecordUseCase,
        private readonly auditEmissionRecordUseCase: IAuditEmissionRecordUseCase,
        private readonly getEmissionRecordHistoryUseCase: IGetEmissionRecordHistoryUseCase,
        private readonly loggerService: ILoggerRepository,
    ) {}

    public store = async (req: Request, res: Response): Promise<void> => {
        this.loggerService.info('emission-record.store', { action: 'start' });
        const validation = this.validator.safeValidate('CreateEmissionRecordDto', req.body);
        if (!validation.success) { CustomResponse.handleErrorValidations(validation.errors, res, this.loggerService); return; }

        const dto = { ...validation.data, recordedDate: new Date(validation.data.recordedDate) };

        this.createEmissionRecordUseCase
            .execute(dto)
            .then((result) => CustomResponse.successResponse({ res, data: toEmissionRecordResponse(result), statusCode: 201 }))
            .catch((error) => CustomResponse.handleError(error, res, this.loggerService));
    };

    public index = async (req: Request, res: Response): Promise<void> => {
        this.loggerService.info('emission-record.index', { action: 'start' });
        const validation = this.validator.safeValidate('EmissionRecordFiltersDto', req.query as Record<string, unknown>);
        if (!validation.success) { CustomResponse.handleErrorValidations(validation.errors, res, this.loggerService); return; }

        const filters = {
            status: validation.data.status,
            fromDate: validation.data.fromDate ? new Date(validation.data.fromDate) : undefined,
            toDate: validation.data.toDate ? new Date(validation.data.toDate) : undefined,
        };

        this.getEmissionRecordsUseCase
            .execute(filters)
            .then((result) => CustomResponse.successResponse({ res, data: result.map(toEmissionRecordResponse) }))
            .catch((error) => CustomResponse.handleError(error, res, this.loggerService));
    };

    public show = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        this.loggerService.info('emission-record.show', { action: 'start', id });
        const validation = this.validator.safeValidate('EmissionRecordIdDto', { id });
        if (!validation.success) { CustomResponse.handleErrorValidations(validation.errors, res, this.loggerService); return; }

        this.getEmissionRecordUseCase
            .execute(validation.data.id)
            .then((result) => CustomResponse.successResponse({ res, data: toEmissionRecordResponse(result) }))
            .catch((error) => CustomResponse.handleError(error, res, this.loggerService));
    };

    public audit = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        this.loggerService.info('emission-record.audit', { action: 'start', id });
        const validation = this.validator.safeValidate('EmissionRecordIdDto', { id });
        if (!validation.success) { CustomResponse.handleErrorValidations(validation.errors, res, this.loggerService); return; }

        this.auditEmissionRecordUseCase
            .execute(validation.data.id)
            .then((result) => CustomResponse.successResponse({ res, data: toEmissionRecordResponse(result) }))
            .catch((error) => CustomResponse.handleError(error, res, this.loggerService));
    };

    public history = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        this.loggerService.info('emission-record.history', { action: 'start', id });
        const validation = this.validator.safeValidate('EmissionRecordIdDto', { id });
        if (!validation.success) { CustomResponse.handleErrorValidations(validation.errors, res, this.loggerService); return; }

        this.getEmissionRecordHistoryUseCase
            .execute(validation.data.id)
            .then((result) => CustomResponse.successResponse({ res, data: result.map(toEmissionRecordHistoryResponse) }))
            .catch((error) => CustomResponse.handleError(error, res, this.loggerService));
    };
}
