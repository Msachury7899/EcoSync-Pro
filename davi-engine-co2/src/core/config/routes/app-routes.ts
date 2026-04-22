import { Router } from "express";

import { MicroserviceConfig, RouterEntry } from "@core/interfaces/microservices.config";
import { envs } from "@core/envs";

const isLocal = envs.NODE_ENV === 'local';

export class AppRoutes {

    static buildRoutes(config: MicroserviceConfig): Router {
        const router = Router();
        if (isLocal) {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            router.use(require('errorhandler')());
        }

        for (const entry of config.routers) {
            AppRoutes.register(config, entry, router);
        }

        return router;
    }

    static buildMonolith(configs: MicroserviceConfig[]): Router {
        const router = Router();
        if (isLocal) {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            router.use(require('errorhandler')());
        }

        for (const config of configs) {
            for (const entry of config.routers) {
                AppRoutes.register(config, entry, router);
            }
        }

        return router;
    }

    static register(config: MicroserviceConfig, entry: RouterEntry, router: Router) {
        const fullPath = `${config.routePrefix}${entry.path}`;
        const middlewares = config.middlewares ?? [];
        router.use(fullPath, ...middlewares, entry.routerFactory());
        console.log(`[RouterRegistry] Registered "${fullPath}"`);
    }
}