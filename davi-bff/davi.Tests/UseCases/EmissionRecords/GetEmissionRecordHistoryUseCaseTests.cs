using davi.Application.UseCases.EmissionRecords;
using davi.Domain.Entities;
using davi.Domain.Ports;
using Moq;

namespace davi.Tests.UseCases.EmissionRecords;

public class GetEmissionRecordHistoryUseCaseTests
{
    [Fact]
    public async Task ExecuteAsync_ReturnsHistory()
    {
        // Arrange
        var mockPort = new Mock<IEmissionRecordPort>();
        var now = DateTime.UtcNow;
        mockPort.Setup(p => p.GetHistoryAsync("1"))
            .ReturnsAsync(
            [
                new EmissionRecordHistory { Id = "h1", EmissionRecordId = "1", Action = "created", NewStatus = "pending", CreatedAt = now },
                new EmissionRecordHistory { Id = "h2", EmissionRecordId = "1", Action = "audited", PreviousStatus = "pending", NewStatus = "audited", ChangedBy = "op@ecosync.com", CreatedAt = now }
            ]);
        var useCase = new GetEmissionRecordHistoryUseCase(mockPort.Object);

        // Act
        var result = (await useCase.ExecuteAsync("1")).ToList();

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Equal("created", result[0].Action);
        Assert.Equal("audited", result[1].Action);
        mockPort.Verify(p => p.GetHistoryAsync("1"), Times.Once);
    }
}
