import { Routes } from '@angular/router';

export const emissionsRoutes: Routes = [{
  path: '',
  loadComponent: () => import('./emissions-page.component').then(m => m.EmissionsPageComponent),
}];
