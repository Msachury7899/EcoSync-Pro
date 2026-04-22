namespace davi.Infrastructure.Configuration;

public record EngineOptions
{
    public string BaseUrl { get; init; } = string.Empty;
    public int TimeoutSeconds { get; init; } = 30;
}
