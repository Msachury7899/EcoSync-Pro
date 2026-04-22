using davi.Domain.Entities;
using davi.Infrastructure.Persistence;
using davi.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace davi.Tests.Repositories;

public class DashboardPostgresRepositoryTests
{
    private static BffDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<BffDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new BffDbContext(options);
    }

    private static EmissionRecord MakeRecord(string id, string fuelTypeId, decimal tco2, DateTime date) =>
        new()
        {
            Id = id,
            FuelTypeId = fuelTypeId,
            Quantity = 100m,
            Unit = "litros",
            FactorSnapshot = 2.68m,
            Tco2Calculated = tco2,
            Status = "pending",
            RecordedDate = date,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

    [Fact]
    public async Task GetMonthlyTco2Async_SumsCorrectly()
    {
        // Arrange
        await using var context = CreateContext();
        context.EmissionRecords.AddRange(
            MakeRecord("1", "ft-1", 10m, new DateTime(2026, 4, 1)),
            MakeRecord("2", "ft-1", 20m, new DateTime(2026, 4, 15)),
            MakeRecord("3", "ft-2", 5m, new DateTime(2026, 3, 1))   // otro mes — no debe sumarse
        );
        await context.SaveChangesAsync();
        var repo = new DashboardPostgresRepository(context);

        // Act
        var result = await repo.GetMonthlyTco2Async("plant-1", 2026, 4);

        // Assert
        Assert.Equal(30m, result);
    }

    [Fact]
    public async Task GetDailyTco2Async_GroupsByDay()
    {
        // Arrange
        await using var context = CreateContext();
        context.EmissionRecords.AddRange(
            MakeRecord("1", "ft-1", 10m, new DateTime(2026, 4, 1, 8, 0, 0)),
            MakeRecord("2", "ft-1", 5m, new DateTime(2026, 4, 1, 17, 0, 0)),  // mismo día
            MakeRecord("3", "ft-1", 8m, new DateTime(2026, 4, 2, 10, 0, 0))
        );
        await context.SaveChangesAsync();
        var repo = new DashboardPostgresRepository(context);

        // Act
        var result = (await repo.GetDailyTco2Async("plant-1", "2026-04")).ToList();

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Equal(15m, result.First(x => x.Date.Day == 1).Tco2);
        Assert.Equal(8m, result.First(x => x.Date.Day == 2).Tco2);
    }

    [Fact]
    public async Task GetFuelBreakdownAsync_GroupsByFuelType()
    {
        // Arrange
        await using var context = CreateContext();
        context.FuelTypes.AddRange(
            new FuelType { Id = "ft-1", Name = "Diesel", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new FuelType { Id = "ft-2", Name = "Gas Natural", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        );
        context.EmissionRecords.AddRange(
            MakeRecord("1", "ft-1", 30m, new DateTime(2026, 4, 1)),
            MakeRecord("2", "ft-1", 10m, new DateTime(2026, 4, 10)),
            MakeRecord("3", "ft-2", 20m, new DateTime(2026, 4, 5))
        );
        await context.SaveChangesAsync();
        var repo = new DashboardPostgresRepository(context);

        // Act
        var result = (await repo.GetFuelBreakdownAsync("plant-1", "2026-04")).ToList();

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Equal(40m, result.First(x => x.FuelTypeId == "ft-1").Tco2);
        Assert.Equal(20m, result.First(x => x.FuelTypeId == "ft-2").Tco2);
    }

    [Fact]
    public async Task GetRecordCountAsync_CountsOnlyGivenMonthAndPlant()
    {
        // Arrange
        await using var context = CreateContext();
        context.EmissionRecords.AddRange(
            MakeRecord("1", "ft-1", 10m, new DateTime(2026, 4, 1)),
            MakeRecord("2", "ft-1", 10m, new DateTime(2026, 4, 20)),
            MakeRecord("3", "ft-1", 10m, new DateTime(2026, 3, 15))  // otro mes
        );
        await context.SaveChangesAsync();
        var repo = new DashboardPostgresRepository(context);

        // Act
        var result = await repo.GetRecordCountAsync("plant-1", "2026-04");

        // Assert
        Assert.Equal(2, result);
    }
}
