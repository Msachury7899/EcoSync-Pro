
import { AppRoutes } from '@core/config/routes/app-routes';
import { allServiceConfigs } from '../config/deploy/monolith';
import { Server } from '@core/config/server';
import { envs } from '@core/envs';
import { buildSwaggerSpec } from './swagger';


const server = new Server({
    port: envs.PORT,
    routes: AppRoutes.buildMonolith(allServiceConfigs),
    swaggerSpec: buildSwaggerSpec(allServiceConfigs),
});

server.start();











