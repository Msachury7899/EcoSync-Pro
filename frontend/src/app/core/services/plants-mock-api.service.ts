import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Plant } from './plant-selector.service';

@Injectable()
export class PlantsMockApiService {
  private readonly _plants: Plant[] = [
    { id: 'p1', name: 'Planta Bogotá',   monthlyLimitTco2: 120, createdAt: '2024-01-15' },
    { id: 'p2', name: 'Planta Medellín', monthlyLimitTco2:  80, createdAt: '2024-02-01' },
    { id: 'p3', name: 'Planta Cali',     monthlyLimitTco2: 100, createdAt: '2024-03-10' },
  ];

  getPlants(): Observable<Plant[]> {
    return of([...this._plants]).pipe(delay(300));
  }
}
