using davi.Application.DTOs.EmissionRecords;
using davi.Domain.Entities;
using davi.Domain.Ports;

namespace davi.Application.UseCases.EmissionRecords;

public class ExportEmissionRecordsUseCase(IEmissionRecordPort port)
{
    public async Task<ExportResult> ExecuteAsync(ExportEmissionRecordFilters filters)
    {
        var query = new ExportEmissionRecordQuery
        {
            PlantId = filters.PlantId,
            Status = filters.Status,
            FromDate = filters.FromDate,
            ToDate = filters.ToDate,
            Format = filters.Format
        };

        return await port.ExportAsync(query);
    }
}
