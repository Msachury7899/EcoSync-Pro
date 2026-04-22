export type EmissionStatus = 'pending' | 'audited';

export interface EmissionRecord {
  id: string;
  plantId: string;
  plantName: string;
  fuelTypeId: string;
  fuelTypeName: string;
  quantity: number;
  unit: string;
  factorSnapshot: number;
  tco2Calculated: number;
  status: EmissionStatus;
  recordedDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmissionRecordDto {
  plantId: string;
  fuelTypeId: string;
  quantity: number;
  unit: string;
  recordedDate: string;
  notes?: string;
}

export interface FuelType {
  id: string;
  name: string;
  units: string[];
}

export interface Plant {
  id: string;
  name: string;
  monthlyLimitTco2: number;
  createdAt: string;
}
