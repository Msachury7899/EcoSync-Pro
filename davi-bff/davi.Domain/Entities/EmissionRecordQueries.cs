namespace davi.Domain.Entities;

public class CreateEmissionRecordCommand
{
    public string PlantId { get; set; } = string.Empty;
    public string FuelTypeId { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public DateTime RecordedDate { get; set; }
    public string? Notes { get; set; }
}

public class EmissionRecordQuery
{
    public string? PlantId { get; set; }
    public string? Status { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int Page { get; set; } = 1;
    public int Limit { get; set; } = 20;
}

public class ExportEmissionRecordQuery
{
    public string? PlantId { get; set; }
    public string? Status { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public string Format { get; set; } = "csv";
}
