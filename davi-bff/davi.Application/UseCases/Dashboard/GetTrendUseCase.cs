using davi.Application.DTOs.Dashboard;
using davi.Domain.Ports;

namespace davi.Application.UseCases.Dashboard;

public class GetTrendUseCase(IDashboardPort port)
{
    public async Task<TrendResponse> ExecuteAsync(string plantId, string month)
    {
        var data = await port.GetTrendAsync(plantId, month);
        return new TrendResponse
        {
            PlantId = data.PlantId,
            Month = data.Month,
            MonthlyLimitTco2 = data.MonthlyLimitTco2,
            Days = data.Days.Select(d => new TrendDayDto
            {
                Date = d.Date,
                Tco2 = d.Tco2
            }).ToList()
        };
    }
}
