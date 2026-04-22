import type { ILoggerRepository } from '@core/interfaces/logger.repository';
import type { EmissionFactorRepository } from '../../domain/emission-factors/emission-factor.repository';
import type { EmissionFactor } from '../../domain/emission-factors/emission-factor.entity';
import type { IGetEmissionFactorsUseCase } from '../../domain/emissions.ports';

export class GetEmissionFactorsUseCase implements IGetEmissionFactorsUseCase {
    constructor(
        private readonly repo: EmissionFactorRepository,
        private readonly logger: ILoggerRepository,
    ) {}

    async execute(): Promise<EmissionFactor[]> {
        this.logger.info('GetEmissionFactorsUseCase.execute');
        return this.repo.findAll();
    }
}
