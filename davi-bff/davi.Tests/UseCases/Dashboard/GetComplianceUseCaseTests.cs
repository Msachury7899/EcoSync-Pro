using davi.Application.UseCases.Dashboard;
using davi.Domain.Entities;
using davi.Domain.Ports;
using Moq;

namespace davi.Tests.UseCases.Dashboard;

public class GetComplianceUseCaseTests
{
    [Fact]
    public async Task ExecuteAsync_ReturnsCompliance_WithCorrectStatus()
    {
        // Arrange
        var mockPort = new Mock<IDashboardPort>();
        mockPort.Setup(p => p.GetComplianceAsync("plant-1", 2026))
            .ReturnsAsync(new ComplianceData
            {
                PlantId = "plant-1",
                PlantName = "Planta Norte",
                MonthlyLimitTco2 = 150m,
                Months =
                [
                    new ComplianceMonth { Month = 1, Label = "Ene", Tco2Real = 98m, PercentOfLimit = 65.3m, Status = "ok" },
                    new ComplianceMonth { Month = 2, Label = "Feb", Tco2Real = 127m, PercentOfLimit = 84.7m, Status = "warning" },
                    new ComplianceMonth { Month = 3, Label = "Mar", Tco2Real = 162m, PercentOfLimit = 108m, Status = "exceeded" }
                ]
            });
        var useCase = new GetComplianceUseCase(mockPort.Object);

        // Act
        var result = await useCase.ExecuteAsync("plant-1", 2026);

        // Assert
        Assert.Equal(3, result.Months.Count);
        Assert.Equal("ok", result.Months[0].Status);
        Assert.Equal("warning", result.Months[1].Status);
        Assert.Equal("exceeded", result.Months[2].Status);
        mockPort.Verify(p => p.GetComplianceAsync("plant-1", 2026), Times.Once);
    }
}
