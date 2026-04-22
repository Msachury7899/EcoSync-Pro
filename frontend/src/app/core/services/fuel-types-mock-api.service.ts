import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { FuelType } from '../../features/emissions/models/emission-record.model';

@Injectable()
export class FuelTypesMockApiService {
  private readonly _fuelTypes: FuelType[] = [
    { id: 'f1', name: 'Diesel',       units: ['L', 'gal'] },
    { id: 'f2', name: 'Gas Natural',  units: ['m3', 'ft3'] },
    { id: 'f3', name: 'Carbón',       units: ['kg', 't'] },
    { id: 'f4', name: 'Fuel Oil',     units: ['L', 'bbl'] },
  ];

  getFuelTypes(): Observable<FuelType[]> {
    return of([...this._fuelTypes]).pipe(delay(300));
  }
}
