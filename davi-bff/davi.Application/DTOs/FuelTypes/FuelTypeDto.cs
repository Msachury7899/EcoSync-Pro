namespace davi.Application.DTOs.FuelTypes;

public class FuelTypeDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public List<string> Units { get; set; } = [];
    public DateTime CreatedAt { get; set; }
}
