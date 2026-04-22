using davi.Application.DTOs.EmissionRecords;
using davi.Domain.Entities;
using davi.Domain.Ports;

namespace davi.Application.UseCases.EmissionRecords;

public class CreateEmissionRecordUseCase(IEmissionRecordPort port)
{
    public async Task<EmissionRecordDto> ExecuteAsync(CreateEmissionRecordRequest request)
    {
        var command = new CreateEmissionRecordCommand
        {
            PlantId = request.PlantId,
            FuelTypeId = request.FuelTypeId,
            Quantity = request.Quantity,
            Unit = request.Unit,
            RecordedDate = request.RecordedDate,
            Notes = request.Notes
        };

        var record = await port.CreateAsync(command);
        return MapToDto(record);
    }

    private static EmissionRecordDto MapToDto(EmissionRecord r) => new()
    {
        Id = r.Id,
        PlantId = r.PlantId,
        PlantName = r.PlantName,
        FuelTypeId = r.FuelTypeId,
        FuelTypeName = r.FuelTypeName,
        Quantity = r.Quantity,
        Unit = r.Unit,
        FactorSnapshot = r.FactorSnapshot,
        Tco2Calculated = r.Tco2Calculated,
        Status = r.Status,
        RecordedDate = r.RecordedDate,
        Notes = r.Notes,
        AuditedBy = r.AuditedBy,
        AuditedAt = r.AuditedAt,
        CreatedAt = r.CreatedAt,
        UpdatedAt = r.UpdatedAt
    };
}
