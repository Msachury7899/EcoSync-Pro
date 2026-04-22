import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { httpAuthInterceptor } from './core/interceptors/http-auth.interceptor';
import { PlantSelectorService } from './core/services/plant-selector.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([httpAuthInterceptor])),
    PlantSelectorService,
  ]
};
