import { MicroserviceConfig } from '@core/interfaces/microservices.config';
import { envs } from '@core/envs';
import { correlationIdMiddleware } from '@core/middlewares/correlation-id.middleware';
import { requestLoggerMiddleware } from '@core/middlewares/request-logger.middleware';
import { FuelTypeRoutes } from '../routes/fuel-type.routes';
import { EmissionFactorRoutes } from '../routes/emission-factor.routes';
import { EmissionRecordRoutes } from '../routes/emission-record.routes';

export const emissionsConfig: MicroserviceConfig = {
    name: 'emissions',
    description: 'Motor de cálculo de CO2 con factores de conversión configurables',
    port: envs.PORT,
    routePrefix: '/api/v1/emissions',
    middlewares: [
        correlationIdMiddleware,
        requestLoggerMiddleware,
    ],
    routers: [
        { path: '/fuel-types', routerFactory: () => FuelTypeRoutes.routes },
        { path: '/emission-factors', routerFactory: () => EmissionFactorRoutes.routes },
        { path: '/records', routerFactory: () => EmissionRecordRoutes.routes },
    ],
    swaggerDocsGlob: 'src/features/emissions/presentation/docs/*.docs.ts',
};
