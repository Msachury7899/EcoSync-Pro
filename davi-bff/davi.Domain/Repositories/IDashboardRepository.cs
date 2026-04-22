namespace davi.Domain.Repositories;

public interface IDashboardRepository
{
    Task<decimal> GetMonthlyTco2Async(string plantId, int year, int month);
    Task<IEnumerable<(DateTime Date, decimal Tco2)>> GetDailyTco2Async(string plantId, string month);
    Task<IEnumerable<(string FuelTypeId, string FuelTypeName, decimal Tco2)>> GetFuelBreakdownAsync(string plantId, string month);
    Task<int> GetRecordCountAsync(string plantId, string month);
}
