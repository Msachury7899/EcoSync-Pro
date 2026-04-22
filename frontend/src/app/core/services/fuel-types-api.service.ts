import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FuelType } from '../../features/emissions/models/emission-record.model';

@Injectable()
export class FuelTypesApiService {
  private readonly http = inject(HttpClient);

  getFuelTypes(): Observable<FuelType[]> {
    return this.http.get<FuelType[]>(`${environment.apiUrl}/fuel-types`);
  }
}
