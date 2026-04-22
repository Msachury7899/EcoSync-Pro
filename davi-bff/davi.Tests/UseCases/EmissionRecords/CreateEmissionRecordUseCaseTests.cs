using davi.Application.DTOs.EmissionRecords;
using davi.Application.UseCases.EmissionRecords;
using davi.Domain.Entities;
using davi.Domain.Ports;
using Moq;

namespace davi.Tests.UseCases.EmissionRecords;

public class CreateEmissionRecordUseCaseTests
{
    [Fact]
    public async Task ExecuteAsync_CreatesRecord_AndReturnsEnrichedDto()
    {
        // Arrange
        var mockPort = new Mock<IEmissionRecordPort>();
        var now = DateTime.UtcNow;
        mockPort.Setup(p => p.CreateAsync(It.IsAny<CreateEmissionRecordCommand>()))
            .ReturnsAsync(new EmissionRecord
            {
                Id = "rec-1",
                PlantId = "plant-1",
                PlantName = "Planta Norte",
                FuelTypeId = "ft-1",
                FuelTypeName = "Diesel",
                Quantity = 250.5m,
                Unit = "litros",
                FactorSnapshot = 2.68m,
                Tco2Calculated = 0.671m,
                Status = "pending",
                RecordedDate = now,
                CreatedAt = now,
                UpdatedAt = now
            });
        var useCase = new CreateEmissionRecordUseCase(mockPort.Object);

        // Act
        var result = await useCase.ExecuteAsync(new CreateEmissionRecordRequest
        {
            PlantId = "plant-1",
            FuelTypeId = "ft-1",
            Quantity = 250.5m,
            Unit = "litros",
            RecordedDate = now
        });

        // Assert
        Assert.Equal("rec-1", result.Id);
        Assert.Equal("Planta Norte", result.PlantName);
        Assert.Equal("Diesel", result.FuelTypeName);
        Assert.Equal("pending", result.Status);
        mockPort.Verify(p => p.CreateAsync(It.IsAny<CreateEmissionRecordCommand>()), Times.Once);
    }
}
