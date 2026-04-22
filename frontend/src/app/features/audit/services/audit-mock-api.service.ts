import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { AuditRecord, AuditListParams } from '../models/audit-record.model';
import { PaginatedResponse } from '../../../core/models/api-response.model';

/** Adaptador mock de AuditApiService — devuelve datos quemados sin tocar el backend. */
@Injectable()
export class AuditMockApiService {

  private readonly _records: AuditRecord[] = [
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
      notes: 'Revisión OK', createdAt: '2026-03-12T09:30:00Z', updatedAt: '2026-03-13T10:00:00Z',
      auditedBy: 'admin@ecosync.co', auditedAt: '2026-03-13T10:00:00Z',
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
    {
      id: 'er5', plantId: 'p1', plantName: 'Planta Bogotá',
      fuelTypeId: 'f4', fuelTypeName: 'Fuel Oil',
      quantity: 150, unit: 'L', factorSnapshot: 3.17, tco2Calculated: 0.476,
      status: 'audited', recordedDate: '2026-03-25',
      notes: 'Aprobado calidad', createdAt: '2026-03-25T14:00:00Z', updatedAt: '2026-03-26T09:00:00Z',
      auditedBy: 'revisor@ecosync.co', auditedAt: '2026-03-26T09:00:00Z',
    },
  ];

  getAuditList(p: AuditListParams): Observable<PaginatedResponse<AuditRecord>> {
    let filtered = [...this._records];

    if (p.plantId) filtered = filtered.filter(r => r.plantId === p.plantId);
    if (p.status)  filtered = filtered.filter(r => r.status  === p.status);
    if (p.fromDate) filtered = filtered.filter(r => r.recordedDate >= p.fromDate!);
    if (p.toDate)   filtered = filtered.filter(r => r.recordedDate <= p.toDate!);

    const limit = p.limit ?? 20;
    const page  = p.page  ?? 1;
    const start = (page - 1) * limit;
    const data  = filtered.slice(start, start + limit);

    return of({
      data,
      pagination: {
        page, limit,
        totalCount: filtered.length,
        totalPages: Math.ceil(filtered.length / limit),
      },
    }).pipe(delay(400));
  }

  markAsAudited(id: string): Observable<AuditRecord> {
    const idx = this._records.findIndex(r => r.id === id);
    if (idx === -1) throw new Error(`Record ${id} not found`);
    this._records[idx] = {
      ...this._records[idx],
      status: 'audited',
      auditedBy: 'mock-auditor@ecosync.co',
      auditedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return of({ ...this._records[idx] }).pipe(delay(350));
  }

  exportRecords(_p: AuditListParams): Observable<Blob> {
    const csv = [
      'id,planta,combustible,cantidad,unidad,tCO2,estado,fecha',
      ...this._records.map(r =>
        `${r.id},${r.plantName},${r.fuelTypeName},${r.quantity},${r.unit},${r.tco2Calculated},${r.status},${r.recordedDate}`
      ),
    ].join('\n');
    return of(new Blob([csv], { type: 'text/csv;charset=utf-8' })).pipe(delay(500));
  }
}
