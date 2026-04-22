namespace davi.Domain.Entities;

public class ComplianceData
{
    public string PlantId { get; set; } = string.Empty;
    public string PlantName { get; set; } = string.Empty;
    public decimal MonthlyLimitTco2 { get; set; }
    public List<ComplianceMonth> Months { get; set; } = [];
}

public class ComplianceMonth
{
    public int Month { get; set; }
    public string Label { get; set; } = string.Empty;
    public decimal Tco2Real { get; set; }
    public decimal PercentOfLimit { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class TrendData
{
    public string PlantId { get; set; } = string.Empty;
    public string Month { get; set; } = string.Empty;
    public decimal MonthlyLimitTco2 { get; set; }
    public List<TrendDay> Days { get; set; } = [];
}

public class TrendDay
{
    public string Date { get; set; } = string.Empty;
    public decimal Tco2 { get; set; }
}

public class FuelBreakdownData
{
    public string PlantId { get; set; } = string.Empty;
    public string Month { get; set; } = string.Empty;
    public decimal TotalTco2 { get; set; }
    public List<FuelBreakdownItem> Breakdown { get; set; } = [];
}

public class FuelBreakdownItem
{
    public string FuelTypeId { get; set; } = string.Empty;
    public string FuelTypeName { get; set; } = string.Empty;
    public decimal Tco2 { get; set; }
    public decimal Percentage { get; set; }
}

public class SummaryData
{
    public string PlantId { get; set; } = string.Empty;
    public string Month { get; set; } = string.Empty;
    public decimal TotalTco2 { get; set; }
    public decimal MonthlyLimitTco2 { get; set; }
    public decimal PercentOfLimit { get; set; }
    public int TotalRecords { get; set; }
    public int RemainingDays { get; set; }
    public string Status { get; set; } = string.Empty;
}
