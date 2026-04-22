using davi.Application.DTOs.Plants;
using davi.Application.UseCases.Plants;
using davi.Domain.Entities;
using davi.Domain.Ports;
using davi.web_api.Controllers;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace davi.Tests.Controllers;

public class PlantsControllerTests
{
    private readonly Mock<IPlantPort> _mockPort = new();

    private PlantsController CreateController()
    {
        var getPlantsUseCase = new GetPlantsUseCase(_mockPort.Object);
        var getPlantByIdUseCase = new GetPlantByIdUseCase(_mockPort.Object);
        return new PlantsController(getPlantsUseCase, getPlantByIdUseCase);
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithPlants()
    {
        _mockPort.Setup(p => p.GetAllAsync()).ReturnsAsync(new List<Plant>
        {
            new() { Id = "1", Name = "Planta Norte", MonthlyLimitTco2 = 100, CreatedAt = DateTime.UtcNow }
        });

        var controller = CreateController();
        var result = await controller.GetAll();

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(200, ok.StatusCode);
    }

    [Fact]
    public async Task GetById_ReturnsOkWhenFound()
    {
        _mockPort.Setup(p => p.GetByIdAsync("1")).ReturnsAsync(
            new Plant { Id = "1", Name = "Planta Norte", MonthlyLimitTco2 = 100, CreatedAt = DateTime.UtcNow });

        var controller = CreateController();
        var result = await controller.GetById("1");

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetById_ReturnsNotFoundWhenMissing()
    {
        _mockPort.Setup(p => p.GetByIdAsync("999")).ThrowsAsync(new KeyNotFoundException());

        var controller = CreateController();
        var result = await controller.GetById("999");

        Assert.IsType<NotFoundResult>(result);
    }
}
