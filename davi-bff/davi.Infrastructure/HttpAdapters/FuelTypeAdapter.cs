using System.Net.Http.Json;
using davi.Domain.Entities;
using davi.Domain.Ports;
using davi.Infrastructure.Configuration;
using Microsoft.Extensions.Options;

namespace davi.Infrastructure.HttpAdapters;

public class FuelTypeAdapter(IHttpClientFactory httpClientFactory, IOptions<EngineOptions> options) : IFuelTypePort
{
    private HttpClient CreateClient()
    {
        var client = httpClientFactory.CreateClient("engine");
        client.Timeout = TimeSpan.FromSeconds(options.Value.TimeoutSeconds);
        return client;
    }

    public async Task<IEnumerable<FuelType>> GetAllAsync()
    {
        var client = CreateClient();
        var response = await client.GetFromJsonAsync<IEnumerable<FuelTypeEngineDto>>(
            "/api/v1/emissions/fuel-types");
        return response?.Select(MapToDomain) ?? [];
    }

    public async Task<FuelType?> GetByIdAsync(string id)
    {
        var client = CreateClient();
        var response = await client.GetFromJsonAsync<FuelTypeEngineDto>(
            $"/api/v1/emissions/fuel-types/{id}");
        return response is null ? null : MapToDomain(response);
    }

    private static FuelType MapToDomain(FuelTypeEngineDto dto) => new()
    {
        Id = dto.Id,
        Name = dto.Name,
        Description = dto.Description,
        Units = dto.Units ?? [],
        CreatedAt = dto.CreatedAt
    };

    private sealed class FuelTypeEngineDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public List<string>? Units { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
