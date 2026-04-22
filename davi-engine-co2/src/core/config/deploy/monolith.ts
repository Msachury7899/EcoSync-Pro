import { MicroserviceConfig } from '@core/interfaces/microservices.config';
import { emissionsConfig } from '@features/emissions/presentation/entrypoints/emissions.microservice';

export const allServiceConfigs: MicroserviceConfig[] = [
    emissionsConfig,
];
