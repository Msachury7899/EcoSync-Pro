import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Plant } from './plant-selector.service';

@Injectable()
export class PlantsApiService {
  private readonly http = inject(HttpClient);

  getPlants(): Observable<Plant[]> {
    return this.http.get<Plant[]>(`${environment.apiUrl}/plants`);
  }
}
