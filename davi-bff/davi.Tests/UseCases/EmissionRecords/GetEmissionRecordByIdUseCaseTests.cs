using davi.Application.UseCases.EmissionRecords;
using davi.Domain.Entities;
using davi.Domain.Ports;
using Moq;

namespace davi.Tests.UseCases.EmissionRecords;

public class GetEmissionRecordByIdUseCaseTests
{
    [Fact]
    public async Task ExecuteAsync_ReturnsDto_WhenExists()
    {
        // Arrange
        var mockPort = new Mock<IEmissionRecordPort>();
        var now = DateTime.UtcNow;
        mockPort.Setup(p => p.GetByIdAsync("1"))
            .ReturnsAsync(new EmissionRecord { Id = "1", Status = "pending", CreatedAt = now, UpdatedAt = now });
        var useCase = new GetEmissionRecordByIdUseCase(mockPort.Object);

        // Act
        var result = await useCase.ExecuteAsync("1");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("1", result.Id);
    }

    [Fact]
    public async Task ExecuteAsync_ReturnsNull_WhenNotFound()
    {
        // Arrange
        var mockPort = new Mock<IEmissionRecordPort>();
        mockPort.Setup(p => p.GetByIdAsync("999")).ReturnsAsync((EmissionRecord?)null);
        var useCase = new GetEmissionRecordByIdUseCase(mockPort.Object);

        // Act
        var result = await useCase.ExecuteAsync("999");

        // Assert
        Assert.Null(result);
    }
}
