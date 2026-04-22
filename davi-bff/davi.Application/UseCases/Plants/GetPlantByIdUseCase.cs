using davi.Application.DTOs.Plants;
using davi.Domain.Ports;

namespace davi.Application.UseCases.Plants;

public class GetPlantByIdUseCase(IPlantPort port)
{
    public async Task<PlantDto> ExecuteAsync(string id)
    {
        var plant = await port.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Plant '{id}' not found.");

        return new PlantDto
        {
            Id = plant.Id,
            Name = plant.Name,
            Location = plant.Location,
            MonthlyLimitTco2 = plant.MonthlyLimitTco2,
            CreatedAt = plant.CreatedAt
        };
    }
}
