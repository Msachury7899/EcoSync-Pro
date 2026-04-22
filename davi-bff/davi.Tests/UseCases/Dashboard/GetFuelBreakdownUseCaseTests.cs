using davi.Application.UseCases.Dashboard;
using davi.Domain.Entities;
using davi.Domain.Ports;
using Moq;

namespace davi.Tests.UseCases.Dashboard;

public class GetFuelBreakdownUseCaseTests
{
    [Fact]
    public async Task ExecuteAsync_ReturnsBreakdown_WithPercentages()
    {
        // Arrange
        var mockPort = new Mock<IDashboardPort>();
        mockPort.Setup(p => p.GetFuelBreakdownAsync("plant-1", "2026-04"))
            .ReturnsAsync(new FuelBreakdownData
            {
                PlantId = "plant-1",
                Month = "2026-04",
                TotalTco2 = 54.2m,
                Breakdown =
                [
                    new FuelBreakdownItem { FuelTypeId = "1", FuelTypeName = "Diesel", Tco2 = 31.8m, Percentage = 58.7m },
                    new FuelBreakdownItem { FuelTypeId = "2", FuelTypeName = "Gas Natural", Tco2 = 14.2m, Percentage = 26.2m },
                    new FuelBreakdownItem { FuelTypeId = "3", FuelTypeName = "Carbón", Tco2 = 8.2m, Percentage = 15.1m }
                ]
            });
        var useCase = new GetFuelBreakdownUseCase(mockPort.Object);

        // Act
        var result = await useCase.ExecuteAsync("plant-1", "2026-04");

        // Assert
        Assert.Equal(3, result.Breakdown.Count);
        Assert.Equal(54.2m, result.TotalTco2);
        var totalPercent = result.Breakdown.Sum(b => b.Percentage);
        Assert.True(totalPercent >= 99m && totalPercent <= 101m, $"Percentages should sum ~100, got {totalPercent}");
        mockPort.Verify(p => p.GetFuelBreakdownAsync("plant-1", "2026-04"), Times.Once);
    }
}
