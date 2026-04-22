using davi.Application.DTOs.EmissionRecords;
using davi.Domain.Ports;

namespace davi.Application.UseCases.EmissionRecords;

public class GetEmissionRecordByIdUseCase(IEmissionRecordPort port)
{
    public async Task<EmissionRecordDto?> ExecuteAsync(string id)
    {
        var record = await port.GetByIdAsync(id);
        if (record is null) return null;

        return new EmissionRecordDto
        {
            Id = record.Id,
            PlantId = record.PlantId,
            PlantName = record.PlantName,
            FuelTypeId = record.FuelTypeId,
            FuelTypeName = record.FuelTypeName,
            Quantity = record.Quantity,
            Unit = record.Unit,
            FactorSnapshot = record.FactorSnapshot,
            Tco2Calculated = record.Tco2Calculated,
            Status = record.Status,
            RecordedDate = record.RecordedDate,
            Notes = record.Notes,
            AuditedBy = record.AuditedBy,
            AuditedAt = record.AuditedAt,
            CreatedAt = record.CreatedAt,
            UpdatedAt = record.UpdatedAt
        };
    }
}
