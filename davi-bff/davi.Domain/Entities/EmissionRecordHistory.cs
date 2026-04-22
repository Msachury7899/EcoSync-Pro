namespace davi.Domain.Entities;

public class EmissionRecordHistory
{
    public string Id { get; set; } = string.Empty;
    public string EmissionRecordId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? PreviousStatus { get; set; }
    public string NewStatus { get; set; } = string.Empty;
    public string? ChangedBy { get; set; }
    public string? Metadata { get; set; }
    public DateTime CreatedAt { get; set; }
}
