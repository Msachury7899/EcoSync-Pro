namespace davi.Application.DTOs.EmissionRecords;

public class CreateEmissionRecordRequest
{
    public string PlantId { get; set; } = string.Empty;
    public string FuelTypeId { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public DateTime RecordedDate { get; set; }
    public string? Notes { get; set; }
}
