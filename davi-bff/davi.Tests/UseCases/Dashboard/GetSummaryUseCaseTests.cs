using davi.Application.UseCases.Dashboard;
using davi.Domain.Entities;
using davi.Domain.Ports;
using Moq;

namespace davi.Tests.UseCases.Dashboard;

public class GetSummaryUseCaseTests
{
    [Fact]
    public async Task ExecuteAsync_ReturnsSummary_WithPercentOfLimit()
    {
        // Arrange
        var mockPort = new Mock<IDashboardPort>();
        mockPort.Setup(p => p.GetSummaryAsync("plant-1", "2026-04"))
            .ReturnsAsync(new SummaryData
            {
                PlantId = "plant-1",
                Month = "2026-04",
                TotalTco2 = 54.2m,
                MonthlyLimitTco2 = 150m,
                PercentOfLimit = 36.1m,
                TotalRecords = 12,
                RemainingDays = 8,
                Status = "ok"
            });
        var useCase = new GetSummaryUseCase(mockPort.Object);

        // Act
        var result = await useCase.ExecuteAsync("plant-1", "2026-04");

        // Assert
        Assert.Equal(36.1m, result.PercentOfLimit);
        Assert.Equal("ok", result.Status);
        Assert.Equal(12, result.TotalRecords);
        mockPort.Verify(p => p.GetSummaryAsync("plant-1", "2026-04"), Times.Once);
    }
}
