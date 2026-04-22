import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.dashboardRoutes),
  },
  {
    path: 'emissions',
    loadChildren: () => import('./features/emissions/emissions.routes').then(m => m.emissionsRoutes),
  },
  {
    path: 'audit',
    loadChildren: () => import('./features/audit/audit.routes').then(m => m.auditRoutes),
  },
  { path: '**', redirectTo: '/dashboard' },
];
