using davi.Application.DTOs.EmissionRecords;
using davi.Domain.Ports;

namespace davi.Application.UseCases.EmissionRecords;

public class GetEmissionRecordHistoryUseCase(IEmissionRecordPort port)
{
    public async Task<IEnumerable<EmissionRecordHistoryDto>> ExecuteAsync(string id)
    {
        var history = await port.GetHistoryAsync(id);
        return history.Select(h => new EmissionRecordHistoryDto
        {
            Id = h.Id,
            EmissionRecordId = h.EmissionRecordId,
            Action = h.Action,
            PreviousStatus = h.PreviousStatus,
            NewStatus = h.NewStatus,
            ChangedBy = h.ChangedBy,
            Metadata = h.Metadata,
            CreatedAt = h.CreatedAt
        });
    }
}
