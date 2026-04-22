using davi.Domain.Entities;
using davi.Domain.Repositories;
using davi.Infrastructure.HttpAdapters;
using Moq;

namespace davi.Tests.Adapters;

public class DashboardAdapterTests
{
    private readonly Mock<IDashboardRepository> _dashboardRepo = new();
    private readonly Mock<IPlantRepository> _plantRepo = new();

    private DashboardAdapter CreateAdapter() => new(_dashboardRepo.Object, _plantRepo.Object);

    private static Plant SamplePlant() => new()
    {
        Id = "p1", Name = "Planta Norte", MonthlyLimitTco2 = 100, CreatedAt = DateTime.UtcNow
    };

    [Fact]
    public async Task GetComplianceAsync_ReturnsMonthlyData()
    {
        _plantRepo.Setup(p => p.GetByIdAsync("p1")).ReturnsAsync(SamplePlant());
        _dashboardRepo.Setup(d => d.GetMonthlyTco2Async("p1", 2025, It.IsAny<int>())).ReturnsAsync(50m);

        var adapter = CreateAdapter();
        var result = await adapter.GetComplianceAsync("p1", 2025);

        Assert.Equal("p1", result.PlantId);
        Assert.Equal(12, result.Months.Count);
        Assert.Equal(50, result.Months[0].PercentOfLimit);
    }

    [Fact]
    public async Task GetComplianceAsync_SetsExceeded_WhenOver100Percent()
    {
        var plant = SamplePlant();
        _plantRepo.Setup(p => p.GetByIdAsync("p1")).ReturnsAsync(plant);
        _dashboardRepo.Setup(d => d.GetMonthlyTco2Async("p1", 2025, It.IsAny<int>())).ReturnsAsync(150m);

        var adapter = CreateAdapter();
        var result = await adapter.GetComplianceAsync("p1", 2025);

        Assert.All(result.Months, m => Assert.Equal("exceeded", m.Status));
    }

    [Fact]
    public async Task GetComplianceAsync_SetsWarning_WhenBetween80And100()
    {
        _plantRepo.Setup(p => p.GetByIdAsync("p1")).ReturnsAsync(SamplePlant());
        _dashboardRepo.Setup(d => d.GetMonthlyTco2Async("p1", 2025, It.IsAny<int>())).ReturnsAsync(90m);

        var adapter = CreateAdapter();
        var result = await adapter.GetComplianceAsync("p1", 2025);

        Assert.All(result.Months, m => Assert.Equal("warning", m.Status));
    }

    [Fact]
    public async Task GetComplianceAsync_ThrowsWhenPlantNotFound()
    {
        _plantRepo.Setup(p => p.GetByIdAsync("missing")).ReturnsAsync((Plant?)null);

        var adapter = CreateAdapter();
        await Assert.ThrowsAsync<KeyNotFoundException>(() => adapter.GetComplianceAsync("missing", 2025));
    }

    [Fact]
    public async Task GetTrendAsync_ReturnsDailyData()
    {
        _plantRepo.Setup(p => p.GetByIdAsync("p1")).ReturnsAsync(SamplePlant());
        _dashboardRepo.Setup(d => d.GetDailyTco2Async("p1", "2025-06")).ReturnsAsync(
            new List<(DateTime Date, decimal Tco2)>
            {
                (new DateTime(2025, 6, 1), 10m),
                (new DateTime(2025, 6, 2), 20m)
            });

        var adapter = CreateAdapter();
        var result = await adapter.GetTrendAsync("p1", "2025-06");

        Assert.Equal(2, result.Days.Count);
        Assert.Equal("2025-06-01", result.Days[0].Date);
    }

    [Fact]
    public async Task GetTrendAsync_ThrowsWhenPlantNotFound()
    {
        _plantRepo.Setup(p => p.GetByIdAsync("missing")).ReturnsAsync((Plant?)null);

        var adapter = CreateAdapter();
        await Assert.ThrowsAsync<KeyNotFoundException>(() => adapter.GetTrendAsync("missing", "2025-06"));
    }

    [Fact]
    public async Task GetFuelBreakdownAsync_ReturnsBreakdownWithPercentages()
    {
        _dashboardRepo.Setup(d => d.GetFuelBreakdownAsync("p1", "2025-06")).ReturnsAsync(
            new List<(string FuelTypeId, string FuelTypeName, decimal Tco2)>
            {
                ("ft-1", "Diesel", 60m),
                ("ft-2", "Gas", 40m)
            });

        var adapter = CreateAdapter();
        var result = await adapter.GetFuelBreakdownAsync("p1", "2025-06");

        Assert.Equal(100, result.TotalTco2);
        Assert.Equal(60, result.Breakdown[0].Percentage);
        Assert.Equal(40, result.Breakdown[1].Percentage);
    }

    [Fact]
    public async Task GetSummaryAsync_ReturnsSummaryData()
    {
        _plantRepo.Setup(p => p.GetByIdAsync("p1")).ReturnsAsync(SamplePlant());
        _dashboardRepo.Setup(d => d.GetMonthlyTco2Async("p1", 2025, 6)).ReturnsAsync(50m);
        _dashboardRepo.Setup(d => d.GetRecordCountAsync("p1", "2025-06")).ReturnsAsync(10);

        var adapter = CreateAdapter();
        var result = await adapter.GetSummaryAsync("p1", "2025-06");

        Assert.Equal(50, result.TotalTco2);
        Assert.Equal(10, result.TotalRecords);
        Assert.Equal("ok", result.Status);
    }

    [Fact]
    public async Task GetSummaryAsync_ThrowsWhenPlantNotFound()
    {
        _plantRepo.Setup(p => p.GetByIdAsync("missing")).ReturnsAsync((Plant?)null);

        var adapter = CreateAdapter();
        await Assert.ThrowsAsync<KeyNotFoundException>(() => adapter.GetSummaryAsync("missing", "2025-06"));
    }

    [Fact]
    public async Task GetSummaryAsync_ThrowsWhenInvalidMonth()
    {
        _plantRepo.Setup(p => p.GetByIdAsync("p1")).ReturnsAsync(SamplePlant());

        var adapter = CreateAdapter();
        await Assert.ThrowsAsync<ArgumentException>(() => adapter.GetSummaryAsync("p1", "invalid"));
    }

    [Fact]
    public async Task GetComplianceAsync_HandlesZeroLimit()
    {
        var plant = new Plant { Id = "p1", Name = "Planta", MonthlyLimitTco2 = 0, CreatedAt = DateTime.UtcNow };
        _plantRepo.Setup(p => p.GetByIdAsync("p1")).ReturnsAsync(plant);
        _dashboardRepo.Setup(d => d.GetMonthlyTco2Async("p1", 2025, It.IsAny<int>())).ReturnsAsync(50m);

        var adapter = CreateAdapter();
        var result = await adapter.GetComplianceAsync("p1", 2025);

        Assert.All(result.Months, m => Assert.Equal(0, m.PercentOfLimit));
    }
}
