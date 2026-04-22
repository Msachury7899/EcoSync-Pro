import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ComplianceData, TrendData, FuelBreakdownData, DashboardSummary } from '../models/dashboard-metrics.model';

@Injectable()
export class DashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/dashboard`;

  getCompliance(plantId: string, year: number): Observable<ComplianceData> {
    const params = new HttpParams().set('plantId', plantId).set('year', year.toString());
    return this.http.get<ComplianceData>(`${this.base}/compliance`, { params });
  }

  getTrend(plantId: string, month: string): Observable<TrendData> {
    const params = new HttpParams().set('plantId', plantId).set('month', month);
    return this.http.get<TrendData>(`${this.base}/trend`, { params });
  }

  getFuelBreakdown(plantId: string, month: string): Observable<FuelBreakdownData> {
    const params = new HttpParams().set('plantId', plantId).set('month', month);
    return this.http.get<FuelBreakdownData>(`${this.base}/fuel-breakdown`, { params });
  }

  getSummary(plantId: string, month: string): Observable<DashboardSummary> {
    const params = new HttpParams().set('plantId', plantId).set('month', month);
    return this.http.get<DashboardSummary>(`${this.base}/summary`, { params });
  }
}
