using davi.Application.DTOs.Dashboard;
using davi.Application.UseCases.Dashboard;
using davi.Domain.Entities;
using davi.Domain.Ports;
using davi.web_api.Controllers;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace davi.Tests.Controllers;

public class DashboardControllerTests
{
    private readonly Mock<IDashboardPort> _mockPort = new();

    private DashboardController CreateController()
    {
        var complianceUseCase = new GetComplianceUseCase(_mockPort.Object);
        var trendUseCase = new GetTrendUseCase(_mockPort.Object);
        var fuelBreakdownUseCase = new GetFuelBreakdownUseCase(_mockPort.Object);
        var summaryUseCase = new GetSummaryUseCase(_mockPort.Object);
        return new DashboardController(complianceUseCase, trendUseCase, fuelBreakdownUseCase, summaryUseCase);
    }

    [Fact]
    public async Task GetCompliance_ReturnsOk()
    {
        _mockPort.Setup(p => p.GetComplianceAsync("p1", 2025)).ReturnsAsync(new ComplianceData
        {
            PlantId = "p1", PlantName = "Planta", MonthlyLimitTco2 = 100, Months = []
        });

        var controller = CreateController();
        var result = await controller.GetCompliance("p1", 2025);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetCompliance_ReturnsBadRequest_WhenInvalidParams()
    {
        var controller = CreateController();
        var result = await controller.GetCompliance("", 2025);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task GetCompliance_ReturnsBadRequest_WhenYearInvalid()
    {
        var controller = CreateController();
        var result = await controller.GetCompliance("p1", 1999);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task GetCompliance_ReturnsNotFound_WhenPlantMissing()
    {
        _mockPort.Setup(p => p.GetComplianceAsync("p1", 2025)).ThrowsAsync(new KeyNotFoundException());

        var controller = CreateController();
        var result = await controller.GetCompliance("p1", 2025);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task GetTrend_ReturnsOk()
    {
        _mockPort.Setup(p => p.GetTrendAsync("p1", "2025-06")).ReturnsAsync(new TrendData
        {
            PlantId = "p1", Month = "2025-06", MonthlyLimitTco2 = 100, Days = []
        });

        var controller = CreateController();
        var result = await controller.GetTrend("p1", "2025-06");

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetTrend_ReturnsBadRequest_WhenMissingParams()
    {
        var controller = CreateController();
        var result = await controller.GetTrend("", "2025-06");

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task GetFuelBreakdown_ReturnsOk()
    {
        _mockPort.Setup(p => p.GetFuelBreakdownAsync("p1", "2025-06")).ReturnsAsync(new FuelBreakdownData
        {
            PlantId = "p1", Month = "2025-06", TotalTco2 = 50, Breakdown = []
        });

        var controller = CreateController();
        var result = await controller.GetFuelBreakdown("p1", "2025-06");

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetFuelBreakdown_ReturnsBadRequest_WhenMissingParams()
    {
        var controller = CreateController();
        var result = await controller.GetFuelBreakdown("p1", "");

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task GetSummary_ReturnsOk()
    {
        _mockPort.Setup(p => p.GetSummaryAsync("p1", "2025-06")).ReturnsAsync(new SummaryData
        {
            PlantId = "p1", Month = "2025-06", TotalTco2 = 50, MonthlyLimitTco2 = 100,
            PercentOfLimit = 50, TotalRecords = 10, RemainingDays = 5, Status = "ok"
        });

        var controller = CreateController();
        var result = await controller.GetSummary("p1", "2025-06");

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetSummary_ReturnsBadRequest_WhenMissingParams()
    {
        var controller = CreateController();
        var result = await controller.GetSummary("", "2025-06");

        Assert.IsType<BadRequestObjectResult>(result);
    }
}
