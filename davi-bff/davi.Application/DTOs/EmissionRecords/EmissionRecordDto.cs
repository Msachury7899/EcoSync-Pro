namespace davi.Application.DTOs.EmissionRecords;

public class EmissionRecordDto
{
    public string Id { get; set; } = string.Empty;
    public string PlantId { get; set; } = string.Empty;
    public string PlantName { get; set; } = string.Empty;
    public string FuelTypeId { get; set; } = string.Empty;
    public string FuelTypeName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal FactorSnapshot { get; set; }
    public decimal Tco2Calculated { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime RecordedDate { get; set; }
    public string? Notes { get; set; }
    public string? AuditedBy { get; set; }
    public DateTime? AuditedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
