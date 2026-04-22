import { EmissionRecord } from '../../emissions/models/emission-record.model';

export type AuditRecord = EmissionRecord & {
  auditedBy?: string;
  auditedAt?: string;
};

export interface EmissionHistoryEntry {
  id: string;
  emissionRecordId: string;
  action: string;
  previousStatus: string | null;
  newStatus: string;
  changedBy: string | null;
  metadata: string | null;
  createdAt: string;
}

export interface AuditListParams {
  plantId?: string;
  status?: 'pending' | 'audited';
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}
