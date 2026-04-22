using davi.Application.UseCases.Plants;
using davi.Domain.Entities;
using davi.Domain.Ports;
using Moq;

namespace davi.Tests.UseCases.Plants;

public class GetPlantsUseCaseTests
{
    [Fact]
    public async Task ExecuteAsync_ReturnsAllPlants()
    {
        // Arrange
        var mockPort = new Mock<IPlantPort>();
        mockPort.Setup(p => p.GetAllAsync()).ReturnsAsync(
        [
            new Plant { Id = "1", Name = "Planta Norte", MonthlyLimitTco2 = 150m, CreatedAt = DateTime.UtcNow },
            new Plant { Id = "2", Name = "Planta Sur", MonthlyLimitTco2 = 200m, CreatedAt = DateTime.UtcNow }
        ]);
        var useCase = new GetPlantsUseCase(mockPort.Object);

        // Act
        var result = (await useCase.ExecuteAsync()).ToList();

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Equal("Planta Norte", result[0].Name);
        mockPort.Verify(p => p.GetAllAsync(), Times.Once);
    }

    [Fact]
    public async Task ExecuteAsync_ReturnsEmptyList_WhenNoPlantsExist()
    {
        // Arrange
        var mockPort = new Mock<IPlantPort>();
        mockPort.Setup(p => p.GetAllAsync()).ReturnsAsync([]);
        var useCase = new GetPlantsUseCase(mockPort.Object);

        // Act
        var result = await useCase.ExecuteAsync();

        // Assert
        Assert.Empty(result);
    }
}
