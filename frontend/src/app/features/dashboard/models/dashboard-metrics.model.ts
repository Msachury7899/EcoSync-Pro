export interface ComplianceMonth {
  month: number;
  label: string;
  tco2Real: number;
  percentOfLimit: number;
  status: 'ok' | 'warning' | 'exceeded';
}

export interface ComplianceData {
  plantId: string;
  plantName: string;
  monthlyLimitTco2: number;
  months: ComplianceMonth[];
}

export interface TrendDay { date: string; tco2: number; }
export interface TrendData {
  plantId: string;
  month: string;
  monthlyLimitTco2: number;
  days: TrendDay[];
}

export interface FuelBreakdownItem {
  fuelTypeId: string;
  fuelTypeName: string;
  tco2: number;
  percentage: number;
}
export interface FuelBreakdownData {
  plantId: string;
  month: string;
  totalTco2: number;
  breakdown: FuelBreakdownItem[];
}

export interface DashboardSummary {
  plantId: string;
  month: string;
  totalTco2: number;
  monthlyLimitTco2: number;
  percentOfLimit: number;
  totalRecords: number;
  remainingDays: number;
  status: 'ok' | 'warning' | 'exceeded';
}
