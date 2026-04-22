import type { ILoggerRepository } from '@core/interfaces/logger.repository';
import type { EmissionRecordRepository, EmissionRecordFilters } from '../../domain/emission-records/emission-record.repository';
import type { EmissionRecord } from '../../domain/emission-records/emission-record.entity';
import type { IGetEmissionRecordsUseCase } from '../../domain/emissions.ports';

export class GetEmissionRecordsUseCase implements IGetEmissionRecordsUseCase {
    constructor(
        private readonly repo: EmissionRecordRepository,
        private readonly logger: ILoggerRepository,
    ) {}

    async execute(filters?: EmissionRecordFilters): Promise<EmissionRecord[]> {
        this.logger.info('GetEmissionRecordsUseCase.execute', { filters });
        return this.repo.findAll(filters);
    }
}
