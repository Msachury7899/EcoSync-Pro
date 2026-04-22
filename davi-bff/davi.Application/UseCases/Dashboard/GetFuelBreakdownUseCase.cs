using davi.Application.DTOs.Dashboard;
using davi.Domain.Ports;

namespace davi.Application.UseCases.Dashboard;

public class GetFuelBreakdownUseCase(IDashboardPort port)
{
    public async Task<FuelBreakdownResponse> ExecuteAsync(string plantId, string month)
    {
        var data = await port.GetFuelBreakdownAsync(plantId, month);
        return new FuelBreakdownResponse
        {
            PlantId = data.PlantId,
            Month = data.Month,
            TotalTco2 = data.TotalTco2,
            Breakdown = data.Breakdown.Select(b => new FuelBreakdownItemDto
            {
                FuelTypeId = b.FuelTypeId,
                FuelTypeName = b.FuelTypeName,
                Tco2 = b.Tco2,
                Percentage = b.Percentage
            }).ToList()
        };
    }
}
