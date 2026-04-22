using davi.Domain.Entities;

namespace davi.Domain.Ports;

public interface IDashboardPort
{
    Task<ComplianceData> GetComplianceAsync(string plantId, int year);
    Task<TrendData> GetTrendAsync(string plantId, string month);
    Task<FuelBreakdownData> GetFuelBreakdownAsync(string plantId, string month);
    Task<SummaryData> GetSummaryAsync(string plantId, string month);
}
