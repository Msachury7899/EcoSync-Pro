import { CustomError } from '@core/util/custom-error';
import type { ILoggerRepository } from '@core/interfaces/logger.repository';
import type { EmissionFactorRepository } from '../../domain/emission-factors/emission-factor.repository';
import type { EmissionFactor } from '../../domain/emission-factors/emission-factor.entity';
import type { IGetEmissionFactorUseCase } from '../../domain/emissions.ports';

export class GetEmissionFactorUseCase implements IGetEmissionFactorUseCase {
    constructor(
        private readonly repo: EmissionFactorRepository,
        private readonly logger: ILoggerRepository,
    ) {}

    async execute(id: string): Promise<EmissionFactor> {
        this.logger.info('GetEmissionFactorUseCase.execute', { id });
        const factor = await this.repo.findById(id);
        if (!factor) throw CustomError.notFound('Factor de emisión no encontrado');
        return factor;
    }
}
