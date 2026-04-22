namespace davi.Application.DTOs.EmissionRecords;

public class EmissionRecordFilters
{
    public string? PlantId { get; set; }
    public string? Status { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int Page { get; set; } = 1;
    public int Limit { get; set; } = 20;
}

public class AuditEmissionRecordRequest
{
    public string? AuditedBy { get; set; }
}

public class ExportEmissionRecordFilters
{
    public string? PlantId { get; set; }
    public string? Status { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public string Format { get; set; } = "csv";
}
