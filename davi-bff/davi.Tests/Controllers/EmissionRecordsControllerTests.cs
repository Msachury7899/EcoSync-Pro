using davi.Application.DTOs.EmissionRecords;
using davi.Application.UseCases.EmissionRecords;
using davi.Domain.Entities;
using davi.Domain.Ports;
using davi.web_api.Controllers;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace davi.Tests.Controllers;

public class EmissionRecordsControllerTests
{
    private readonly Mock<IEmissionRecordPort> _mockPort = new();

    private static EmissionRecord SampleRecord() => new()
    {
        Id = "rec-1", PlantId = "p1", PlantName = "Planta", FuelTypeId = "ft-1", FuelTypeName = "Diesel",
        Quantity = 100, Unit = "kg", FactorSnapshot = 2.5m, Tco2Calculated = 0.25m, Status = "pending",
        RecordedDate = DateTime.UtcNow, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
    };

    private EmissionRecordsController CreateController()
    {
        var createUseCase = new CreateEmissionRecordUseCase(_mockPort.Object);
        var getAllUseCase = new GetEmissionRecordsUseCase(_mockPort.Object);
        var getByIdUseCase = new GetEmissionRecordByIdUseCase(_mockPort.Object);
        var auditUseCase = new AuditEmissionRecordUseCase(_mockPort.Object);
        var historyUseCase = new GetEmissionRecordHistoryUseCase(_mockPort.Object);
        var exportUseCase = new ExportEmissionRecordsUseCase(_mockPort.Object);
        return new EmissionRecordsController(createUseCase, getAllUseCase, getByIdUseCase, auditUseCase, historyUseCase, exportUseCase);
    }

    [Fact]
    public async Task Create_ReturnsCreatedAtAction()
    {
        _mockPort.Setup(p => p.CreateAsync(It.IsAny<CreateEmissionRecordCommand>())).ReturnsAsync(SampleRecord());

        var controller = CreateController();
        var request = new CreateEmissionRecordRequest
        {
            PlantId = "p1", FuelTypeId = "ft-1", Quantity = 100, Unit = "kg", RecordedDate = DateTime.UtcNow
        };

        var result = await controller.Create(request);
        var created = Assert.IsType<CreatedAtActionResult>(result);
        Assert.Equal(201, created.StatusCode);
    }

    [Fact]
    public async Task GetAll_ReturnsOk()
    {
        _mockPort.Setup(p => p.GetAllAsync(It.IsAny<EmissionRecordQuery>())).ReturnsAsync(
            new PaginatedResult<EmissionRecord>
            {
                Data = new[] { SampleRecord() }, Page = 1, Limit = 20, TotalCount = 1
            });

        var controller = CreateController();
        var result = await controller.GetAll(new EmissionRecordFilters());

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetById_ReturnsOkWhenFound()
    {
        _mockPort.Setup(p => p.GetByIdAsync("rec-1")).ReturnsAsync(SampleRecord());

        var controller = CreateController();
        var result = await controller.GetById("rec-1");

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetById_ReturnsNotFoundWhenNull()
    {
        _mockPort.Setup(p => p.GetByIdAsync("999")).ReturnsAsync((EmissionRecord?)null);

        var controller = CreateController();
        var result = await controller.GetById("999");

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Audit_ReturnsOk()
    {
        _mockPort.Setup(p => p.AuditAsync("rec-1", "admin")).ReturnsAsync(SampleRecord());

        var controller = CreateController();
        var result = await controller.Audit("rec-1", new AuditEmissionRecordRequest { AuditedBy = "admin" });

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetHistory_ReturnsOk()
    {
        _mockPort.Setup(p => p.GetHistoryAsync("rec-1")).ReturnsAsync(new List<EmissionRecordHistory>
        {
            new() { Id = "h1", EmissionRecordId = "rec-1", Action = "created", NewStatus = "pending", CreatedAt = DateTime.UtcNow }
        });

        var controller = CreateController();
        var result = await controller.GetHistory("rec-1");

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Export_ReturnsFile()
    {
        _mockPort.Setup(p => p.ExportAsync(It.IsAny<ExportEmissionRecordQuery>())).ReturnsAsync(
            new ExportResult { Content = new byte[] { 1, 2, 3 }, ContentType = "text/csv", FileName = "export.csv" });

        var controller = CreateController();
        var result = await controller.Export(new ExportEmissionRecordFilters());

        Assert.IsType<FileContentResult>(result);
    }
}
