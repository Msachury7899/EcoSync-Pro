using davi.Application.DTOs.EmissionRecords;
using davi.Application.UseCases.EmissionRecords;
using davi.Domain.Entities;
using davi.Domain.Ports;
using Moq;

namespace davi.Tests.UseCases.EmissionRecords;

public class AuditEmissionRecordUseCaseTests
{
    [Fact]
    public async Task ExecuteAsync_ChangesStatusToAudited()
    {
        // Arrange
        var mockPort = new Mock<IEmissionRecordPort>();
        var now = DateTime.UtcNow;
        mockPort.Setup(p => p.AuditAsync("1", "operador@ecosync.com"))
            .ReturnsAsync(new EmissionRecord
            {
                Id = "1",
                Status = "audited",
                AuditedBy = "operador@ecosync.com",
                AuditedAt = now,
                CreatedAt = now,
                UpdatedAt = now
            });
        var useCase = new AuditEmissionRecordUseCase(mockPort.Object);

        // Act
        var result = await useCase.ExecuteAsync("1", new AuditEmissionRecordRequest { AuditedBy = "operador@ecosync.com" });

        // Assert
        Assert.Equal("audited", result.Status);
        Assert.Equal("operador@ecosync.com", result.AuditedBy);
        mockPort.Verify(p => p.AuditAsync("1", "operador@ecosync.com"), Times.Once);
    }
}
