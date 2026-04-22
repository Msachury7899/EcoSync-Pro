using davi.Application.UseCases.Plants;
using davi.Domain.Entities;
using davi.Domain.Ports;
using Moq;

namespace davi.Tests.UseCases.Plants;

public class GetPlantByIdUseCaseTests
{
    [Fact]
    public async Task ExecuteAsync_ReturnsPlant_WhenExists()
    {
        // Arrange
        var mockPort = new Mock<IPlantPort>();
        mockPort.Setup(p => p.GetByIdAsync("1")).ReturnsAsync(
            new Plant { Id = "1", Name = "Planta Norte", MonthlyLimitTco2 = 150m, CreatedAt = DateTime.UtcNow });
        var useCase = new GetPlantByIdUseCase(mockPort.Object);

        // Act
        var result = await useCase.ExecuteAsync("1");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("1", result.Id);
        Assert.Equal("Planta Norte", result.Name);
        mockPort.Verify(p => p.GetByIdAsync("1"), Times.Once);
    }

    [Fact]
    public async Task ExecuteAsync_ThrowsKeyNotFoundException_WhenNotFound()
    {
        // Arrange
        var mockPort = new Mock<IPlantPort>();
        mockPort.Setup(p => p.GetByIdAsync("999")).ReturnsAsync((Plant?)null);
        var useCase = new GetPlantByIdUseCase(mockPort.Object);

        // Act & Assert
        await Assert.ThrowsAsync<KeyNotFoundException>(() => useCase.ExecuteAsync("999"));
    }
}
