using davi.Domain.Entities;
using davi.Domain.Ports;
using davi.Domain.Repositories;

namespace davi.Infrastructure.HttpAdapters;

public class DashboardAdapter(IDashboardRepository dashboardRepo, IPlantRepository plantRepo) : IDashboardPort
{
    private static readonly string[] MonthLabels =
        ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    public async Task<ComplianceData> GetComplianceAsync(string plantId, int year)
    {
        var plant = await plantRepo.GetByIdAsync(plantId)
            ?? throw new KeyNotFoundException($"Plant '{plantId}' not found.");

        var months = new List<ComplianceMonth>();
        for (int m = 1; m <= 12; m++)
        {
            var tco2 = await dashboardRepo.GetMonthlyTco2Async(plantId, year, m);
            var percent = plant.MonthlyLimitTco2 > 0
                ? Math.Round(tco2 / plant.MonthlyLimitTco2 * 100, 1)
                : 0;

            months.Add(new ComplianceMonth
            {
                Month = m,
                Label = MonthLabels[m - 1],
                Tco2Real = tco2,
                PercentOfLimit = percent,
                Status = percent >= 100 ? "exceeded" : percent >= 80 ? "warning" : "ok"
            });
        }

        return new ComplianceData
        {
            PlantId = plant.Id,
            PlantName = plant.Name,
            MonthlyLimitTco2 = plant.MonthlyLimitTco2,
            Months = months
        };
    }

    public async Task<TrendData> GetTrendAsync(string plantId, string month)
    {
        var plant = await plantRepo.GetByIdAsync(plantId)
            ?? throw new KeyNotFoundException($"Plant '{plantId}' not found.");

        var daily = await dashboardRepo.GetDailyTco2Async(plantId, month);

        return new TrendData
        {
            PlantId = plant.Id,
            Month = month,
            MonthlyLimitTco2 = plant.MonthlyLimitTco2,
            Days = daily.Select(d => new TrendDay
            {
                Date = d.Date.ToString("yyyy-MM-dd"),
                Tco2 = d.Tco2
            }).ToList()
        };
    }

    public async Task<FuelBreakdownData> GetFuelBreakdownAsync(string plantId, string month)
    {
        var breakdown = await dashboardRepo.GetFuelBreakdownAsync(plantId, month);
        var items = breakdown.ToList();
        var total = items.Sum(x => x.Tco2);

        return new FuelBreakdownData
        {
            PlantId = plantId,
            Month = month,
            TotalTco2 = total,
            Breakdown = items.Select(x => new FuelBreakdownItem
            {
                FuelTypeId = x.FuelTypeId,
                FuelTypeName = x.FuelTypeName,
                Tco2 = x.Tco2,
                Percentage = total > 0 ? Math.Round(x.Tco2 / total * 100, 1) : 0
            }).ToList()
        };
    }

    public async Task<SummaryData> GetSummaryAsync(string plantId, string month)
    {
        var plant = await plantRepo.GetByIdAsync(plantId)
            ?? throw new KeyNotFoundException($"Plant '{plantId}' not found.");

        if (!DateTime.TryParseExact(month + "-01", "yyyy-MM-dd",
            System.Globalization.CultureInfo.InvariantCulture,
            System.Globalization.DateTimeStyles.None, out var parsed))
            throw new ArgumentException($"Invalid month format: '{month}'. Expected YYYY-MM.");

        var totalTco2 = await dashboardRepo.GetMonthlyTco2Async(plantId, parsed.Year, parsed.Month);
        var totalRecords = await dashboardRepo.GetRecordCountAsync(plantId, month);
        var daysInMonth = DateTime.DaysInMonth(parsed.Year, parsed.Month);
        var remainingDays = Math.Max(0, daysInMonth - DateTime.UtcNow.Day);
        var percent = plant.MonthlyLimitTco2 > 0
            ? Math.Round(totalTco2 / plant.MonthlyLimitTco2 * 100, 1)
            : 0;

        return new SummaryData
        {
            PlantId = plant.Id,
            Month = month,
            TotalTco2 = totalTco2,
            MonthlyLimitTco2 = plant.MonthlyLimitTco2,
            PercentOfLimit = percent,
            TotalRecords = totalRecords,
            RemainingDays = remainingDays,
            Status = percent >= 100 ? "exceeded" : percent >= 80 ? "warning" : "ok"
        };
    }
}
