import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import {
  ComplianceData, TrendData, FuelBreakdownData, DashboardSummary,
} from '../models/dashboard-metrics.model';

/** Adaptador mock de DashboardApiService — devuelve datos quemados sin tocar el backend. */
@Injectable()
export class DashboardMockApiService {

  getCompliance(_plantId: string, year: number): Observable<ComplianceData> {
    const data: ComplianceData = {
      plantId: _plantId, plantName: 'Planta Bogotá', monthlyLimitTco2: 120,
      months: [
        { month: 1, label: 'Ene', tco2Real:  68, percentOfLimit:  57, status: 'ok'       },
        { month: 2, label: 'Feb', tco2Real:  95, percentOfLimit:  79, status: 'ok'       },
        { month: 3, label: 'Mar', tco2Real: 103, percentOfLimit:  86, status: 'warning'  },
        { month: 4, label: 'Abr', tco2Real: 145, percentOfLimit: 121, status: 'exceeded' },
        { month: 5, label: 'May', tco2Real:  72, percentOfLimit:  60, status: 'ok'       },
        { month: 6, label: 'Jun', tco2Real:  55, percentOfLimit:  46, status: 'ok'       },
        { month: 7, label: 'Jul', tco2Real:  88, percentOfLimit:  73, status: 'ok'       },
        { month: 8, label: 'Ago', tco2Real: 118, percentOfLimit:  98, status: 'warning'  },
        { month: 9, label: 'Sep', tco2Real:  42, percentOfLimit:  35, status: 'ok'       },
        { month: 10, label: 'Oct', tco2Real: 60, percentOfLimit:  50, status: 'ok'       },
        { month: 11, label: 'Nov', tco2Real: 77, percentOfLimit:  64, status: 'ok'       },
        { month: 12, label: 'Dic', tco2Real: 90, percentOfLimit:  75, status: 'ok'       },
      ],
    };
    return of(data).pipe(delay(400));
  }

  getTrend(_plantId: string, month: string): Observable<TrendData> {
    const days = Array.from({ length: 22 }, (_, i) => {
      const day = String(i + 1).padStart(2, '0');
      const base = 3 + Math.sin(i * 0.5) * 1.5;
      return { date: `${month}-${day}`, tco2: parseFloat(base.toFixed(3)) };
    });
    return of({ plantId: _plantId, month, monthlyLimitTco2: 120, days }).pipe(delay(400));
  }

  getFuelBreakdown(_plantId: string, _month: string): Observable<FuelBreakdownData> {
    return of({
      plantId: _plantId, month: _month, totalTco2: 55.3,
      breakdown: [
        { fuelTypeId: 'f1', fuelTypeName: 'Diesel',      tco2: 28.0, percentage: 50.6 },
        { fuelTypeId: 'f2', fuelTypeName: 'Gas Natural',  tco2: 17.5, percentage: 31.6 },
        { fuelTypeId: 'f3', fuelTypeName: 'Carbón',       tco2:  9.8, percentage: 17.7 },
      ],
    }).pipe(delay(400));
  }

  getSummary(_plantId: string, _month: string): Observable<DashboardSummary> {
    return of({
      plantId: _plantId, month: _month,
      totalTco2: 55.3, monthlyLimitTco2: 120,
      percentOfLimit: 46, totalRecords: 18, remainingDays: 8,
      status: 'ok',
    } as DashboardSummary).pipe(delay(350));
  }
}
