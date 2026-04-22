using davi.Domain.Entities;
using davi.Infrastructure.Persistence.Configurations;
using Microsoft.EntityFrameworkCore;

namespace davi.Infrastructure.Persistence;

public class BffDbContext(DbContextOptions<BffDbContext> options) : DbContext(options)
{
    public DbSet<Plant> Plants => Set<Plant>();
    public DbSet<FuelType> FuelTypes => Set<FuelType>();
    public DbSet<EmissionRecord> EmissionRecords => Set<EmissionRecord>();
    public DbSet<EmissionRecordHistory> EmissionRecordHistories => Set<EmissionRecordHistory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new PlantConfiguration());
        modelBuilder.ApplyConfiguration(new FuelTypeConfiguration());
        modelBuilder.ApplyConfiguration(new EmissionRecordConfiguration());
        modelBuilder.ApplyConfiguration(new EmissionRecordHistoryConfiguration());
        base.OnModelCreating(modelBuilder);
    }
}
