using davi.Application.DTOs.Dashboard;
using davi.Domain.Ports;

namespace davi.Application.UseCases.Dashboard;

public class GetSummaryUseCase(IDashboardPort port)
{
    public async Task<SummaryResponse> ExecuteAsync(string plantId, string month)
    {
        var data = await port.GetSummaryAsync(plantId, month);
        return new SummaryResponse
        {
            PlantId = data.PlantId,
            Month = data.Month,
            TotalTco2 = data.TotalTco2,
            MonthlyLimitTco2 = data.MonthlyLimitTco2,
            PercentOfLimit = data.PercentOfLimit,
            TotalRecords = data.TotalRecords,
            RemainingDays = data.RemainingDays,
            Status = data.Status
        };
    }
}
