using davi.Application.UseCases.FuelTypes;
using davi.Domain.Entities;
using davi.Domain.Ports;
using Moq;

namespace davi.Tests.UseCases.FuelTypes;

public class GetFuelTypesUseCaseTests
{
    [Fact]
    public async Task ExecuteAsync_ReturnsAllFuelTypes()
    {
        // Arrange
        var mockPort = new Mock<IFuelTypePort>();
        mockPort.Setup(p => p.GetAllAsync()).ReturnsAsync(
        [
            new FuelType { Id = "1", Name = "Diesel", Units = ["litros", "galones"], CreatedAt = DateTime.UtcNow },
            new FuelType { Id = "2", Name = "Gas Natural", Units = ["m3"], CreatedAt = DateTime.UtcNow }
        ]);
        var useCase = new GetFuelTypesUseCase(mockPort.Object);

        // Act
        var result = (await useCase.ExecuteAsync()).ToList();

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Equal("Diesel", result[0].Name);
        Assert.Contains("litros", result[0].Units);
        mockPort.Verify(p => p.GetAllAsync(), Times.Once);
    }

    [Fact]
    public async Task ExecuteAsync_ReturnsEmptyList_WhenNoFuelTypesExist()
    {
        // Arrange
        var mockPort = new Mock<IFuelTypePort>();
        mockPort.Setup(p => p.GetAllAsync()).ReturnsAsync([]);
        var useCase = new GetFuelTypesUseCase(mockPort.Object);

        // Act
        var result = await useCase.ExecuteAsync();

        // Assert
        Assert.Empty(result);
    }
}
