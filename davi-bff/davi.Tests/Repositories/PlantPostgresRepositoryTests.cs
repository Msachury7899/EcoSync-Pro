using davi.Domain.Entities;
using davi.Infrastructure.Persistence;
using davi.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace davi.Tests.Repositories;

public class PlantPostgresRepositoryTests
{
    private static BffDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<BffDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new BffDbContext(options);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsAllSeededPlants()
    {
        // Arrange
        await using var context = CreateContext();
        context.Plants.AddRange(
            new Plant { Id = "1", Name = "Planta Norte", MonthlyLimitTco2 = 150m, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Plant { Id = "2", Name = "Planta Sur", MonthlyLimitTco2 = 200m, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        );
        await context.SaveChangesAsync();
        var repo = new PlantPostgresRepository(context);

        // Act
        var result = (await repo.GetAllAsync()).ToList();

        // Assert
        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsPlant_WhenExists()
    {
        // Arrange
        await using var context = CreateContext();
        context.Plants.Add(new Plant { Id = "1", Name = "Planta Norte", MonthlyLimitTco2 = 150m, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        await context.SaveChangesAsync();
        var repo = new PlantPostgresRepository(context);

        // Act
        var result = await repo.GetByIdAsync("1");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Planta Norte", result.Name);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsNull_WhenNotFound()
    {
        // Arrange
        await using var context = CreateContext();
        var repo = new PlantPostgresRepository(context);

        // Act
        var result = await repo.GetByIdAsync("999");

        // Assert
        Assert.Null(result);
    }
}
