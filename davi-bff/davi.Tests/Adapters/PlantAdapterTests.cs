using davi.Domain.Entities;
using davi.Domain.Repositories;
using davi.Infrastructure.HttpAdapters;
using Moq;

namespace davi.Tests.Adapters;

public class PlantAdapterTests
{
    private readonly Mock<IPlantRepository> _mockRepo = new();

    [Fact]
    public async Task GetAllAsync_DelegatesToRepository()
    {
        var plants = new List<Plant>
        {
            new() { Id = "1", Name = "Planta Norte", MonthlyLimitTco2 = 100, CreatedAt = DateTime.UtcNow }
        };
        _mockRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(plants);

        var adapter = new PlantAdapter(_mockRepo.Object);
        var result = await adapter.GetAllAsync();

        Assert.Single(result);
        _mockRepo.Verify(r => r.GetAllAsync(), Times.Once);
    }

    [Fact]
    public async Task GetByIdAsync_DelegatesToRepository()
    {
        var plant = new Plant { Id = "1", Name = "Planta", MonthlyLimitTco2 = 100, CreatedAt = DateTime.UtcNow };
        _mockRepo.Setup(r => r.GetByIdAsync("1")).ReturnsAsync(plant);

        var adapter = new PlantAdapter(_mockRepo.Object);
        var result = await adapter.GetByIdAsync("1");

        Assert.NotNull(result);
        Assert.Equal("1", result!.Id);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsNullWhenNotFound()
    {
        _mockRepo.Setup(r => r.GetByIdAsync("999")).ReturnsAsync((Plant?)null);

        var adapter = new PlantAdapter(_mockRepo.Object);
        var result = await adapter.GetByIdAsync("999");

        Assert.Null(result);
    }
}
