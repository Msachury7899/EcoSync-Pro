import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { httpAuthInterceptor } from './core/interceptors/http-auth.interceptor';
import { PlantSelectorService } from './core/services/plant-selector.service';
import { PlantsApiService } from './core/services/plants-api.service';
import { PlantsMockApiService } from './core/services/plants-mock-api.service';
import { FuelTypesApiService } from './core/services/fuel-types-api.service';
import { FuelTypesMockApiService } from './core/services/fuel-types-mock-api.service';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([httpAuthInterceptor])),
    PlantSelectorService,
    { provide: PlantsApiService,    useClass: environment.useMocks ? PlantsMockApiService    : PlantsApiService    },
    { provide: FuelTypesApiService, useClass: environment.useMocks ? FuelTypesMockApiService : FuelTypesApiService },
  ]
};
