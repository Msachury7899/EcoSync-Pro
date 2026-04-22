using davi.Application.DTOs.EmissionRecords;
using davi.Domain.Entities;
using davi.Domain.Ports;

namespace davi.Application.UseCases.EmissionRecords;

public class GetEmissionRecordsUseCase(IEmissionRecordPort port)
{
    public async Task<PaginatedResult<EmissionRecordDto>> ExecuteAsync(EmissionRecordFilters filters)
    {
        var query = new EmissionRecordQuery
        {
            PlantId = filters.PlantId,
            Status = filters.Status,
            FromDate = filters.FromDate,
            ToDate = filters.ToDate,
            Page = filters.Page,
            Limit = filters.Limit
        };

        var result = await port.GetAllAsync(query);

        return new PaginatedResult<EmissionRecordDto>
        {
            Data = result.Data.Select(MapToDto),
            Page = result.Page,
            Limit = result.Limit,
            TotalCount = result.TotalCount
        };
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
