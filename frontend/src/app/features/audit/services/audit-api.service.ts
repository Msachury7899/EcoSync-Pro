import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuditRecord, AuditListParams } from '../models/audit-record.model';
import { PaginatedResponse } from '../../../core/models/api-response.model';

@Injectable()
export class AuditApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/emission-records`;

  getAuditList(p: AuditListParams): Observable<PaginatedResponse<AuditRecord>> {
    let params = new HttpParams()
      .set('page', p.page?.toString() ?? '1')
      .set('limit', p.limit?.toString() ?? '20');
    if (p.plantId)  params = params.set('plantId', p.plantId);
    if (p.status)   params = params.set('status', p.status);
    if (p.fromDate) params = params.set('fromDate', p.fromDate);
    if (p.toDate)   params = params.set('toDate', p.toDate);
    return this.http.get<PaginatedResponse<AuditRecord>>(this.base, { params });
  }

  markAsAudited(id: string): Observable<AuditRecord> {
    return this.http.patch<AuditRecord>(`${this.base}/${id}/audit`, {});
  }

  exportRecords(p: AuditListParams): Observable<Blob> {
    let params = new HttpParams();
    if (p.plantId)  params = params.set('plantId', p.plantId);
    if (p.status)   params = params.set('status', p.status);
    if (p.fromDate) params = params.set('fromDate', p.fromDate);
    if (p.toDate)   params = params.set('toDate', p.toDate);
    return this.http.get(`${this.base}/export`, { params, responseType: 'blob' });
  }
}
