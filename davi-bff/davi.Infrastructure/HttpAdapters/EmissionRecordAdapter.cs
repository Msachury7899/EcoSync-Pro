using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using davi.Domain.Entities;
using davi.Domain.Ports;
using davi.Infrastructure.Configuration;
using Microsoft.Extensions.Options;

namespace davi.Infrastructure.HttpAdapters;

public class EmissionRecordAdapter(IHttpClientFactory httpClientFactory, IOptions<EngineOptions> options) : IEmissionRecordPort
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    private HttpClient CreateClient()
    {
        var client = httpClientFactory.CreateClient("engine");
        client.Timeout = TimeSpan.FromSeconds(options.Value.TimeoutSeconds);
        return client;
    }

    public async Task<EmissionRecord> CreateAsync(CreateEmissionRecordCommand command)
    {
        var client = CreateClient();
        var body = JsonSerializer.Serialize(command, JsonOptions);
        var response = await client.PostAsync(
            "/api/v1/emissions/emission-records",
            new StringContent(body, Encoding.UTF8, "application/json"));
        response.EnsureSuccessStatusCode();
        var dto = await response.Content.ReadFromJsonAsync<EmissionRecordEngineDto>()
            ?? throw new InvalidOperationException("Empty response from engine on CreateAsync.");
        return MapToDomain(dto);
    }

    public async Task<PaginatedResult<EmissionRecord>> GetAllAsync(EmissionRecordQuery query)
    {
        var client = CreateClient();
        var url = BuildQueryString("/api/v1/emissions/emission-records", query);
        var dto = await client.GetFromJsonAsync<PaginatedEngineDto>(url)
            ?? new PaginatedEngineDto();
        return new PaginatedResult<EmissionRecord>
        {
            Data = dto.Data?.Select(MapToDomain) ?? [],
            Page = dto.Pagination?.Page ?? query.Page,
            Limit = dto.Pagination?.Limit ?? query.Limit,
            TotalCount = dto.Pagination?.TotalCount ?? 0
        };
    }

    public async Task<EmissionRecord?> GetByIdAsync(string id)
    {
        var client = CreateClient();
        var dto = await client.GetFromJsonAsync<EmissionRecordEngineDto>(
            $"/api/v1/emissions/emission-records/{id}");
        return dto is null ? null : MapToDomain(dto);
    }

    public async Task<EmissionRecord> AuditAsync(string id, string? auditedBy)
    {
        var client = CreateClient();
        var body = JsonSerializer.Serialize(new { auditedBy }, JsonOptions);
        var response = await client.PatchAsync(
            $"/api/v1/emissions/emission-records/{id}/audit",
            new StringContent(body, Encoding.UTF8, "application/json"));
        response.EnsureSuccessStatusCode();
        var dto = await response.Content.ReadFromJsonAsync<EmissionRecordEngineDto>()
            ?? throw new InvalidOperationException("Empty response from engine on AuditAsync.");
        return MapToDomain(dto);
    }

    public async Task<IEnumerable<EmissionRecordHistory>> GetHistoryAsync(string id)
    {
        var client = CreateClient();
        var dtos = await client.GetFromJsonAsync<IEnumerable<HistoryEngineDto>>(
            $"/api/v1/emissions/emission-records/{id}/history");
        return dtos?.Select(h => new EmissionRecordHistory
        {
            Id = h.Id,
            EmissionRecordId = h.EmissionRecordId,
            Action = h.Action,
            PreviousStatus = h.PreviousStatus,
            NewStatus = h.NewStatus,
            ChangedBy = h.ChangedBy,
            Metadata = h.Metadata,
            CreatedAt = h.CreatedAt
        }) ?? [];
    }

    public async Task<ExportResult> ExportAsync(ExportEmissionRecordQuery query)
    {
        var client = CreateClient();
        var qs = new List<string>();
        if (!string.IsNullOrEmpty(query.PlantId)) qs.Add($"plantId={Uri.EscapeDataString(query.PlantId)}");
        if (!string.IsNullOrEmpty(query.Status)) qs.Add($"status={Uri.EscapeDataString(query.Status)}");
        if (query.FromDate.HasValue) qs.Add($"fromDate={query.FromDate:O}");
        if (query.ToDate.HasValue) qs.Add($"toDate={query.ToDate:O}");
        qs.Add($"format={Uri.EscapeDataString(query.Format)}");

        var url = "/api/v1/emissions/emission-records/export?" + string.Join("&", qs);
        var response = await client.GetAsync(url);
        response.EnsureSuccessStatusCode();

        var content = await response.Content.ReadAsByteArrayAsync();
        var contentType = response.Content.Headers.ContentType?.MediaType ?? "text/csv";
        var filename = response.Content.Headers.ContentDisposition?.FileName
            ?? $"emissions-export-{DateTime.UtcNow:yyyy-MM}.{query.Format}";

        return new ExportResult { Content = content, ContentType = contentType, FileName = filename };
    }

    private static string BuildQueryString(string baseUrl, EmissionRecordQuery q)
    {
        var qs = new List<string> { $"page={q.Page}", $"limit={q.Limit}" };
        if (!string.IsNullOrEmpty(q.PlantId)) qs.Add($"plantId={Uri.EscapeDataString(q.PlantId)}");
        if (!string.IsNullOrEmpty(q.Status)) qs.Add($"status={Uri.EscapeDataString(q.Status)}");
        if (q.FromDate.HasValue) qs.Add($"fromDate={q.FromDate:O}");
        if (q.ToDate.HasValue) qs.Add($"toDate={q.ToDate:O}");
        return baseUrl + "?" + string.Join("&", qs);
    }

    private static EmissionRecord MapToDomain(EmissionRecordEngineDto dto) => new()
    {
        Id = dto.Id,
        PlantId = dto.PlantId,
        PlantName = dto.PlantName,
        FuelTypeId = dto.FuelTypeId,
        FuelTypeName = dto.FuelTypeName,
        Quantity = dto.Quantity,
        Unit = dto.Unit,
        FactorSnapshot = dto.FactorSnapshot,
        Tco2Calculated = dto.Tco2Calculated,
        Status = dto.Status,
        RecordedDate = dto.RecordedDate,
        Notes = dto.Notes,
        AuditedBy = dto.AuditedBy,
        AuditedAt = dto.AuditedAt,
        CreatedAt = dto.CreatedAt,
        UpdatedAt = dto.UpdatedAt
    };

    private sealed class EmissionRecordEngineDto
    {
        public string Id { get; set; } = string.Empty;
        public string PlantId { get; set; } = string.Empty;
        public string PlantName { get; set; } = string.Empty;
        public string FuelTypeId { get; set; } = string.Empty;
        public string FuelTypeName { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = string.Empty;
        public decimal FactorSnapshot { get; set; }
        public decimal Tco2Calculated { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime RecordedDate { get; set; }
        public string? Notes { get; set; }
        public string? AuditedBy { get; set; }
        public DateTime? AuditedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    private sealed class PaginatedEngineDto
    {
        public List<EmissionRecordEngineDto>? Data { get; set; }
        public PaginationDto? Pagination { get; set; }
    }

    private sealed class PaginationDto
    {
        public int Page { get; set; }
        public int Limit { get; set; }
        public int TotalCount { get; set; }
    }

    private sealed class HistoryEngineDto
    {
        public string Id { get; set; } = string.Empty;
        public string EmissionRecordId { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string? PreviousStatus { get; set; }
        public string NewStatus { get; set; } = string.Empty;
        public string? ChangedBy { get; set; }
        public string? Metadata { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
