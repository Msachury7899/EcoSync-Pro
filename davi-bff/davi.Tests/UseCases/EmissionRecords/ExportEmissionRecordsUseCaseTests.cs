using davi.Application.DTOs.EmissionRecords;
using davi.Application.UseCases.EmissionRecords;
using davi.Domain.Entities;
using davi.Domain.Ports;
using Moq;

namespace davi.Tests.UseCases.EmissionRecords;

public class ExportEmissionRecordsUseCaseTests
{
    [Fact]
    public async Task ExecuteAsync_ReturnsExportResult_WithCorrectContentType()
    {
        // Arrange
        var mockPort = new Mock<IEmissionRecordPort>();
        mockPort.Setup(p => p.ExportAsync(It.IsAny<ExportEmissionRecordQuery>()))
            .ReturnsAsync(new ExportResult
            {
                Content = "id,plantId\n1,plant-1"u8.ToArray(),
                ContentType = "text/csv",
                FileName = "emissions-export-2026-04.csv"
            });
        var useCase = new ExportEmissionRecordsUseCase(mockPort.Object);

        // Act
        var result = await useCase.ExecuteAsync(new ExportEmissionRecordFilters { Format = "csv" });

        // Assert
        Assert.Equal("text/csv", result.ContentType);
        Assert.NotEmpty(result.Content);
        Assert.Contains("2026-04", result.FileName);
    }
}
