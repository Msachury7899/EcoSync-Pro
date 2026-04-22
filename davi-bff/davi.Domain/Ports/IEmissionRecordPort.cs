using davi.Domain.Entities;

namespace davi.Domain.Ports;

public interface IEmissionRecordPort
{
    Task<EmissionRecord> CreateAsync(CreateEmissionRecordCommand command);
    Task<PaginatedResult<EmissionRecord>> GetAllAsync(EmissionRecordQuery query);
    Task<EmissionRecord?> GetByIdAsync(string id);
    Task<EmissionRecord> AuditAsync(string id, string? auditedBy);
    Task<IEnumerable<EmissionRecordHistory>> GetHistoryAsync(string id);
    Task<ExportResult> ExportAsync(ExportEmissionRecordQuery query);
}
