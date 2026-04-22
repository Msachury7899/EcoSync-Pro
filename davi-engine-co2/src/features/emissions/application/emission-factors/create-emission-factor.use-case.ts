import { ulid } from 'ulid';
import type { ILoggerRepository } from '@core/interfaces/logger.repository';
import type { EmissionFactorRepository, CreateEmissionFactorData } from '../../domain/emission-factors/emission-factor.repository';
import type { EmissionFactor } from '../../domain/emission-factors/emission-factor.entity';
import type { ICreateEmissionFactorUseCase } from '../../domain/emissions.ports';

export class CreateEmissionFactorUseCase implements ICreateEmissionFactorUseCase {
    constructor(
        private readonly repo: EmissionFactorRepository,
        private readonly logger: ILoggerRepository,
    ) {}

    async execute(data: Omit<CreateEmissionFactorData, 'id'>): Promise<EmissionFactor> {
        this.logger.info('CreateEmissionFactorUseCase.execute', { fuelTypeId: data.fuelTypeId });
        return this.repo.create({ id: ulid(), ...data });
    }
}
