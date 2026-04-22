using davi.Application.DTOs.EmissionRecords;
using davi.Application.UseCases.EmissionRecords;
using davi.Domain.Entities;
using davi.Domain.Ports;
using Moq;

namespace davi.Tests.UseCases.EmissionRecords;

public class GetEmissionRecordsUseCaseTests
{
    [Fact]
    public async Task ExecuteAsync_ReturnsPaginatedResult()
    {
        // Arrange
        var mockPort = new Mock<IEmissionRecordPort>();
        var now = DateTime.UtcNow;
        mockPort.Setup(p => p.GetAllAsync(It.IsAny<EmissionRecordQuery>()))
            .ReturnsAsync(new PaginatedResult<EmissionRecord>
            {
                Data = [new EmissionRecord { Id = "1", Status = "pending", CreatedAt = now, UpdatedAt = now }],
                Page = 1,
                Limit = 20,
                TotalCount = 1
            });
        var useCase = new GetEmissionRecordsUseCase(mockPort.Object);

        // Act
        var result = await useCase.ExecuteAsync(new EmissionRecordFilters());

        // Assert
        Assert.Single(result.Data);
        Assert.Equal(1, result.TotalCount);
        Assert.Equal(1, result.TotalPages);
    }

    [Fact]
    public async Task ExecuteAsync_PassesFiltersToPort()
    {
        // Arrange
        var mockPort = new Mock<IEmissionRecordPort>();
        mockPort.Setup(p => p.GetAllAsync(It.Is<EmissionRecordQuery>(q =>
            q.PlantId == "plant-1" && q.Status == "pending")))
            .ReturnsAsync(new PaginatedResult<EmissionRecord> { Data = [], Page = 1, Limit = 20, TotalCount = 0 });
        var useCase = new GetEmissionRecordsUseCase(mockPort.Object);

        // Act
        await useCase.ExecuteAsync(new EmissionRecordFilters { PlantId = "plant-1", Status = "pending" });

        // Assert
        mockPort.Verify(p => p.GetAllAsync(It.Is<EmissionRecordQuery>(q =>
            q.PlantId == "plant-1" && q.Status == "pending")), Times.Once);
    }
}
