namespace davi.Application.DTOs.Plants;

public class PlantDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Location { get; set; }
    public decimal MonthlyLimitTco2 { get; set; }
    public DateTime CreatedAt { get; set; }
}
