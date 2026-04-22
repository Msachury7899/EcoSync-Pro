using davi.Application.UseCases.Dashboard;
using davi.Domain.Entities;
using davi.Domain.Ports;
using Moq;

namespace davi.Tests.UseCases.Dashboard;

public class GetTrendUseCaseTests
{
    [Fact]
    public async Task ExecuteAsync_ReturnsTrend_WithDailyData()
    {
        // Arrange
        var mockPort = new Mock<IDashboardPort>();
        mockPort.Setup(p => p.GetTrendAsync("plant-1", "2026-04"))
            .ReturnsAsync(new TrendData
            {
                PlantId = "plant-1",
                Month = "2026-04",
                MonthlyLimitTco2 = 150m,
                Days =
                [
                    new TrendDay { Date = "2026-04-01", Tco2 = 3.2m },
                    new TrendDay { Date = "2026-04-02", Tco2 = 5.8m }
                ]
            });
        var useCase = new GetTrendUseCase(mockPort.Object);

        // Act
        var result = await useCase.ExecuteAsync("plant-1", "2026-04");

        // Assert
        Assert.Equal(2, result.Days.Count);
        Assert.Equal(3.2m, result.Days[0].Tco2);
        mockPort.Verify(p => p.GetTrendAsync("plant-1", "2026-04"), Times.Once);
    }
}
