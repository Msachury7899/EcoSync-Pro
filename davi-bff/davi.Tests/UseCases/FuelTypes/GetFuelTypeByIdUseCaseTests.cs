using davi.Application.UseCases.FuelTypes;
using davi.Domain.Entities;
using davi.Domain.Ports;
using Moq;

namespace davi.Tests.UseCases.FuelTypes;

public class GetFuelTypeByIdUseCaseTests
{
    [Fact]
    public async Task ExecuteAsync_ReturnsFuelType_WhenExists()
    {
        // Arrange
        var mockPort = new Mock<IFuelTypePort>();
        mockPort.Setup(p => p.GetByIdAsync("1")).ReturnsAsync(
            new FuelType { Id = "1", Name = "Diesel", Units = ["litros"], CreatedAt = DateTime.UtcNow });
        var useCase = new GetFuelTypeByIdUseCase(mockPort.Object);

        // Act
        var result = await useCase.ExecuteAsync("1");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Diesel", result.Name);
    }

    [Fact]
    public async Task ExecuteAsync_ReturnsNull_WhenNotFound()
    {
        // Arrange
        var mockPort = new Mock<IFuelTypePort>();
        mockPort.Setup(p => p.GetByIdAsync("999")).ReturnsAsync((FuelType?)null);
        var useCase = new GetFuelTypeByIdUseCase(mockPort.Object);

        // Act
        var result = await useCase.ExecuteAsync("999");

        // Assert
        Assert.Null(result);
    }
}
