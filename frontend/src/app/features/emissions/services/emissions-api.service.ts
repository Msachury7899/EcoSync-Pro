import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { EmissionRecord, CreateEmissionRecordDto, FuelType, Plant } from '../models/emission-record.model';
import { PaginatedResponse } from '../../../core/models/api-response.model';

@Injectable()
export class EmissionsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getFuelTypes(): Observable<FuelType[]> {
    return this.http.get<FuelType[]>(`${this.base}/fuel-types`);
  }

  getPlants(): Observable<Plant[]> {
    return this.http.get<Plant[]>(`${this.base}/plants`);
  }

  createEmissionRecord(dto: CreateEmissionRecordDto): Observable<EmissionRecord> {
    return this.http.post<EmissionRecord>(`${this.base}/emission-records`, dto);
  }

  getEmissionRecords(plantId: string, limit = 10): Observable<EmissionRecord[]> {
    let params = new HttpParams().set('limit', limit.toString());
    if (plantId) params = params.set('plantId', plantId);
    return this.http.get<PaginatedResponse<EmissionRecord>>(`${this.base}/emission-records`, { params })
      .pipe(map(r => r.data));
  }
}
