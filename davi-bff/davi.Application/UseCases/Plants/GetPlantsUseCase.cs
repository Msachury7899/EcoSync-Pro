using davi.Application.DTOs.Plants;
using davi.Domain.Ports;

namespace davi.Application.UseCases.Plants;

public class GetPlantsUseCase(IPlantPort port)
{
    public async Task<IEnumerable<PlantDto>> ExecuteAsync()
    {
        var plants = await port.GetAllAsync();
        return plants.Select(p => new PlantDto
        {
            Id = p.Id,
            Name = p.Name,
            Location = p.Location,
            MonthlyLimitTco2 = p.MonthlyLimitTco2,
            CreatedAt = p.CreatedAt
        });
    }
}
