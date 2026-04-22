using davi.Application.DTOs.Dashboard;
using davi.Domain.Ports;

namespace davi.Application.UseCases.Dashboard;

public class GetComplianceUseCase(IDashboardPort port)
{
    public async Task<ComplianceResponse> ExecuteAsync(string plantId, int year)
    {
        var data = await port.GetComplianceAsync(plantId, year);
        return new ComplianceResponse
        {
            PlantId = data.PlantId,
            PlantName = data.PlantName,
            MonthlyLimitTco2 = data.MonthlyLimitTco2,
            Months = data.Months.Select(m => new ComplianceMonthDto
            {
                Month = m.Month,
                Label = m.Label,
                Tco2Real = m.Tco2Real,
                PercentOfLimit = m.PercentOfLimit,
                Status = m.Status
            }).ToList()
        };
    }
}
