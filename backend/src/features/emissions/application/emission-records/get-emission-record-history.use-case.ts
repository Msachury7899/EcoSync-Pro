import type { ILoggerRepository } from '@core/interfaces/logger.repository';
import type { EmissionRecordRepository } from '../../domain/emission-records/emission-record.repository';
import type { EmissionRecordHistory } from '../../domain/emission-records/emission-record-history.entity';
import type { IGetEmissionRecordHistoryUseCase } from '../../domain/emissions.ports';

export class GetEmissionRecordHistoryUseCase implements IGetEmissionRecordHistoryUseCase {
    constructor(
        private readonly repo: EmissionRecordRepository,
        private readonly logger: ILoggerRepository,
    ) {}

    async execute(emissionRecordId: string): Promise<EmissionRecordHistory[]> {
        this.logger.info('GetEmissionRecordHistoryUseCase.execute', { emissionRecordId });
        return this.repo.findHistory(emissionRecordId);
    }
}
