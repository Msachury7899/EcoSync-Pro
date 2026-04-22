import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { EmissionRecord, CreateEmissionRecordDto, FuelType, Plant } from '../models/emission-record.model';

/** Adaptador mock de EmissionsApiService — devuelve datos quemados sin tocar el backend. */
@Injectable()
export class EmissionsMockApiService {

  private readonly _plants: Plant[] = [
    { id: 'p1', name: 'Planta Bogotá',   monthlyLimitTco2: 120, createdAt: '2024-01-15' },
    { id: 'p2', name: 'Planta Medellín', monthlyLimitTco2:  80, createdAt: '2024-02-01' },
    { id: 'p3', name: 'Planta Cali',     monthlyLimitTco2: 100, createdAt: '2024-03-10' },
  ];

  private readonly _fuelTypes: FuelType[] = [
    { id: 'f1', name: 'Diesel',       units: ['L', 'gal'] },
    { id: 'f2', name: 'Gas Natural',  units: ['m3', 'ft3'] },
    { id: 'f3', name: 'Carbón',       units: ['kg', 't'] },
    { id: 'f4', name: 'Fuel Oil',     units: ['L', 'bbl'] },
  ];

  private readonly _records: EmissionRecord[] = [
    {
      id: 'er1', plantId: 'p1', plantName: 'Planta Bogotá',
      fuelTypeId: 'f1', fuelTypeName: 'Diesel',
      quantity: 500, unit: 'L', factorSnapshot: 2.65, tco2Calculated: 1.325,
      status: 'pending', recordedDate: '2026-03-10',
      notes: null, createdAt: '2026-03-10T08:00:00Z', updatedAt: '2026-03-10T08:00:00Z',
    },
    {
      id: 'er2', plantId: 'p1', plantName: 'Planta Bogotá',
      fuelTypeId: 'f2', fuelTypeName: 'Gas Natural',
      quantity: 200, unit: 'm3', factorSnapshot: 1.96, tco2Calculated: 0.392,
      status: 'audited', recordedDate: '2026-03-12',
      notes: 'Revisión mensual OK', createdAt: '2026-03-12T09:30:00Z', updatedAt: '2026-03-13T10:00:00Z',
    },
    {
      id: 'er3', plantId: 'p1', plantName: 'Planta Bogotá',
      fuelTypeId: 'f3', fuelTypeName: 'Carbón',
      quantity: 800, unit: 'kg', factorSnapshot: 2.42, tco2Calculated: 1.936,
      status: 'pending', recordedDate: '2026-03-18',
      notes: null, createdAt: '2026-03-18T07:00:00Z', updatedAt: '2026-03-18T07:00:00Z',
    },
    {
      id: 'er4', plantId: 'p2', plantName: 'Planta Medellín',
      fuelTypeId: 'f1', fuelTypeName: 'Diesel',
      quantity: 300, unit: 'L', factorSnapshot: 2.65, tco2Calculated: 0.795,
      status: 'pending', recordedDate: '2026-03-20',
      notes: null, createdAt: '2026-03-20T11:00:00Z', updatedAt: '2026-03-20T11:00:00Z',
    },
  ];

  private nextId = 5;

  getFuelTypes(): Observable<FuelType[]> {
    return of([...this._fuelTypes]).pipe(delay(300));
  }

  getPlants(): Observable<Plant[]> {
    return of([...this._plants]).pipe(delay(300));
  }

  createEmissionRecord(dto: CreateEmissionRecordDto): Observable<EmissionRecord> {
    const plant = this._plants.find(p => p.id === dto.plantId);
    const fuel  = this._fuelTypes.find(f => f.id === dto.fuelTypeId);
    const factor = 2.5; // factor genérico de demo
    const newRecord: EmissionRecord = {
      id: `er${this.nextId++}`,
      plantId: dto.plantId,
      plantName: plant?.name ?? 'Desconocida',
      fuelTypeId: dto.fuelTypeId,
      fuelTypeName: fuel?.name ?? 'Desconocido',
      quantity: dto.quantity,
      unit: dto.unit,
      factorSnapshot: factor,
      tco2Calculated: parseFloat((dto.quantity * factor / 1000).toFixed(4)),
      status: 'pending',
      recordedDate: dto.recordedDate,
      notes: dto.notes ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this._records.push(newRecord);
    return of({ ...newRecord }).pipe(delay(400));
  }

  getEmissionRecords(plantId: string, limit = 10): Observable<EmissionRecord[]> {
    const filtered = plantId
      ? this._records.filter(r => r.plantId === plantId)
      : this._records;
    return of(filtered.slice(0, limit)).pipe(delay(400));
  }
}
