using davi.Application.DTOs.FuelTypes;
using davi.Domain.Ports;

namespace davi.Application.UseCases.FuelTypes;

public class GetFuelTypeByIdUseCase(IFuelTypePort port)
{
    public async Task<FuelTypeDto?> ExecuteAsync(string id)
    {
        var fuelType = await port.GetByIdAsync(id);
        if (fuelType is null) return null;

        return new FuelTypeDto
        {
            Id = fuelType.Id,
            Name = fuelType.Name,
            Description = fuelType.Description,
            Units = fuelType.Units,
            CreatedAt = fuelType.CreatedAt
        };
    }
}
