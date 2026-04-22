using davi.Domain.Repositories;
using davi.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace davi.Infrastructure.Repositories;

public class DashboardPostgresRepository(BffDbContext dbContext) : IDashboardRepository
{
    public async Task<decimal> GetMonthlyTco2Async(string plantId, int year, int month)
    {
        return (decimal)await dbContext.EmissionRecords
            .AsNoTracking()
            .Where(r => r.FuelTypeId != null
                && r.RecordedDate.Year == year
                && r.RecordedDate.Month == month)
            .SumAsync(r => (double)r.Tco2Calculated);
    }

    public async Task<IEnumerable<(DateTime Date, decimal Tco2)>> GetDailyTco2Async(string plantId, string month)
    {
        if (!DateTime.TryParseExact(month + "-01", "yyyy-MM-dd",
            System.Globalization.CultureInfo.InvariantCulture,
            System.Globalization.DateTimeStyles.None, out var parsed))
            return [];

        var year = parsed.Year;
        var m = parsed.Month;

        var result = await dbContext.EmissionRecords
            .AsNoTracking()
            .Where(r => r.RecordedDate.Year == year && r.RecordedDate.Month == m)
            .GroupBy(r => r.RecordedDate.Date)
            .Select(g => new { Date = g.Key, Tco2 = g.Sum(r => (double)r.Tco2Calculated) })
            .OrderBy(x => x.Date)
            .ToListAsync();

        return result.Select(x => (x.Date, (decimal)x.Tco2));
    }

    public async Task<IEnumerable<(string FuelTypeId, string FuelTypeName, decimal Tco2)>> GetFuelBreakdownAsync(string plantId, string month)
    {
        if (!DateTime.TryParseExact(month + "-01", "yyyy-MM-dd",
            System.Globalization.CultureInfo.InvariantCulture,
            System.Globalization.DateTimeStyles.None, out var parsed))
            return [];

        var year = parsed.Year;
        var m = parsed.Month;

        var result = await dbContext.EmissionRecords
            .AsNoTracking()
            .Where(r => r.RecordedDate.Year == year && r.RecordedDate.Month == m)
            .Join(dbContext.FuelTypes,
                r => r.FuelTypeId,
                f => f.Id,
                (r, f) => new { r.FuelTypeId, FuelTypeName = f.Name, r.Tco2Calculated })
            .GroupBy(x => new { x.FuelTypeId, x.FuelTypeName })
            .Select(g => new
            {
                g.Key.FuelTypeId,
                g.Key.FuelTypeName,
                Tco2 = g.Sum(x => (double)x.Tco2Calculated)
            })
            .ToListAsync();

        return result.Select(x => (x.FuelTypeId, x.FuelTypeName, (decimal)x.Tco2));
    }

    public async Task<int> GetRecordCountAsync(string plantId, string month)
    {
        if (!DateTime.TryParseExact(month + "-01", "yyyy-MM-dd",
            System.Globalization.CultureInfo.InvariantCulture,
            System.Globalization.DateTimeStyles.None, out var parsed))
            return 0;

        return await dbContext.EmissionRecords
            .AsNoTracking()
            .CountAsync(r => r.RecordedDate.Year == parsed.Year && r.RecordedDate.Month == parsed.Month);
    }
}
