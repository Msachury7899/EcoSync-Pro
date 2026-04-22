using davi.Application.DTOs.FuelTypes;
using davi.Domain.Ports;

namespace davi.Application.UseCases.FuelTypes;

public class GetFuelTypesUseCase(IFuelTypePort port)
{
    public async Task<IEnumerable<FuelTypeDto>> ExecuteAsync()
    {
        var fuelTypes = await port.GetAllAsync();
        return fuelTypes.Select(f => new FuelTypeDto
        {
            Id = f.Id,
            Name = f.Name,
            Description = f.Description,
            Units = f.Units,
            CreatedAt = f.CreatedAt
        });
    }
}
