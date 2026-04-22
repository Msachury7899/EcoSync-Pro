namespace davi.Application.DTOs.Dashboard;

public class ComplianceResponse
{
    public string PlantId { get; set; } = string.Empty;
    public string PlantName { get; set; } = string.Empty;
    public decimal MonthlyLimitTco2 { get; set; }
    public List<ComplianceMonthDto> Months { get; set; } = [];
}

public class ComplianceMonthDto
{
    public int Month { get; set; }
    public string Label { get; set; } = string.Empty;
    public decimal Tco2Real { get; set; }
    public decimal PercentOfLimit { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class TrendResponse
{
    public string PlantId { get; set; } = string.Empty;
    public string Month { get; set; } = string.Empty;
    public decimal MonthlyLimitTco2 { get; set; }
    public List<TrendDayDto> Days { get; set; } = [];
}

public class TrendDayDto
{
    public string Date { get; set; } = string.Empty;
    public decimal Tco2 { get; set; }
}

public class FuelBreakdownResponse
{
    public string PlantId { get; set; } = string.Empty;
    public string Month { get; set; } = string.Empty;
    public decimal TotalTco2 { get; set; }
    public List<FuelBreakdownItemDto> Breakdown { get; set; } = [];
}

public class FuelBreakdownItemDto
{
    public string FuelTypeId { get; set; } = string.Empty;
    public string FuelTypeName { get; set; } = string.Empty;
    public decimal Tco2 { get; set; }
    public decimal Percentage { get; set; }
}

public class SummaryResponse
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
