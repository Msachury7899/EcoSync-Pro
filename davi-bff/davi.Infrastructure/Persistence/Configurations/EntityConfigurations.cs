using davi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace davi.Infrastructure.Persistence.Configurations;

public class PlantConfiguration : IEntityTypeConfiguration<Plant>
{
    public void Configure(EntityTypeBuilder<Plant> builder)
    {
        builder.ToTable("plants");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasColumnName("id");
        builder.Property(p => p.Name).HasColumnName("name").IsRequired();
        builder.HasIndex(p => p.Name).IsUnique();
        builder.Property(p => p.Location).HasColumnName("location");
        builder.Property(p => p.MonthlyLimitTco2).HasColumnName("monthly_limit_tco2").IsRequired();
        builder.Property(p => p.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(p => p.UpdatedAt).HasColumnName("updated_at").IsRequired();
    }
}

public class FuelTypeConfiguration : IEntityTypeConfiguration<FuelType>
{
    public void Configure(EntityTypeBuilder<FuelType> builder)
    {
        builder.ToTable("fuel_types");
        builder.HasKey(f => f.Id);
        builder.Property(f => f.Id).HasColumnName("id");
        builder.Property(f => f.Name).HasColumnName("name").IsRequired();
        builder.HasIndex(f => f.Name).IsUnique();
        builder.Property(f => f.Description).HasColumnName("description");
        builder.Property(f => f.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(f => f.UpdatedAt).HasColumnName("updated_at").IsRequired();
        builder.Ignore(f => f.Units);
    }
}

public class EmissionRecordConfiguration : IEntityTypeConfiguration<EmissionRecord>
{
    public void Configure(EntityTypeBuilder<EmissionRecord> builder)
    {
        builder.ToTable("emission_records");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).HasColumnName("id");
        builder.Property(e => e.FuelTypeId).HasColumnName("fuel_type_id").IsRequired();
        builder.Property(e => e.Quantity).HasColumnName("quantity").IsRequired();
        builder.Property(e => e.Unit).HasColumnName("unit").IsRequired();
        builder.Property(e => e.FactorSnapshot).HasColumnName("factor_snapshot").IsRequired();
        builder.Property(e => e.Tco2Calculated).HasColumnName("tco2_calculated").IsRequired();
        builder.Property(e => e.Status).HasColumnName("status").IsRequired();
        builder.Property(e => e.RecordedDate).HasColumnName("recorded_date").IsRequired();
        builder.Property(e => e.Notes).HasColumnName("notes");
        builder.Property(e => e.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(e => e.UpdatedAt).HasColumnName("updated_at").IsRequired();
        // PlantId, PlantName, FuelTypeName, AuditedBy, AuditedAt son campos enriquecidos BFF
        builder.Ignore(e => e.PlantId);
        builder.Ignore(e => e.PlantName);
        builder.Ignore(e => e.FuelTypeName);
        builder.Ignore(e => e.AuditedBy);
        builder.Ignore(e => e.AuditedAt);
    }
}

public class EmissionRecordHistoryConfiguration : IEntityTypeConfiguration<EmissionRecordHistory>
{
    public void Configure(EntityTypeBuilder<EmissionRecordHistory> builder)
    {
        builder.ToTable("emission_record_history");
        builder.HasKey(h => h.Id);
        builder.Property(h => h.Id).HasColumnName("id");
        builder.Property(h => h.EmissionRecordId).HasColumnName("emission_record_id").IsRequired();
        builder.Property(h => h.Action).HasColumnName("action").IsRequired();
        builder.Property(h => h.PreviousStatus).HasColumnName("previous_status");
        builder.Property(h => h.NewStatus).HasColumnName("new_status").IsRequired();
        builder.Property(h => h.ChangedBy).HasColumnName("changed_by");
        builder.Property(h => h.Metadata).HasColumnName("metadata");
        builder.Property(h => h.CreatedAt).HasColumnName("created_at").IsRequired();
    }
}
