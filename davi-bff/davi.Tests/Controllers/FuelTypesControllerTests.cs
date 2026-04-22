using davi.Application.DTOs.FuelTypes;
using davi.Application.UseCases.FuelTypes;
using davi.Domain.Entities;
using davi.Domain.Ports;
using davi.web_api.Controllers;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace davi.Tests.Controllers;

public class FuelTypesControllerTests
{
    private readonly Mock<IFuelTypePort> _mockPort = new();

    private FuelTypesController CreateController()
    {
        var getAllUseCase = new GetFuelTypesUseCase(_mockPort.Object);
        var getByIdUseCase = new GetFuelTypeByIdUseCase(_mockPort.Object);
        return new FuelTypesController(getAllUseCase, getByIdUseCase);
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithFuelTypes()
    {
        _mockPort.Setup(p => p.GetAllAsync()).ReturnsAsync(new List<FuelType>
        {
            new() { Id = "1", Name = "Diesel", CreatedAt = DateTime.UtcNow }
        });

        var controller = CreateController();
        var result = await controller.GetAll();

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetById_ReturnsOkWhenFound()
    {
        _mockPort.Setup(p => p.GetByIdAsync("1")).ReturnsAsync(
            new FuelType { Id = "1", Name = "Diesel", CreatedAt = DateTime.UtcNow });

        var controller = CreateController();
        var result = await controller.GetById("1");

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetById_ReturnsNotFoundWhenNull()
    {
        _mockPort.Setup(p => p.GetByIdAsync("999")).ReturnsAsync((FuelType?)null);

        var controller = CreateController();
        var result = await controller.GetById("999");

        Assert.IsType<NotFoundResult>(result);
    }
}
