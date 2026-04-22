using davi.Domain.Ports;
using davi.Domain.Repositories;
using davi.Infrastructure.Configuration;
using davi.Infrastructure.HttpAdapters;
using davi.Infrastructure.Persistence;
using davi.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace davi.Infrastructure.Extensions;

public static class InfrastructureExtensions
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // PostgreSQL via EF Core
        services.AddDbContext<BffDbContext>(opt =>
            opt.UseNpgsql(configuration.GetConnectionString("Postgres")));

        // Options para engine HTTP
        services.Configure<EngineOptions>(configuration.GetSection("Engine"));

        // HttpClient named "engine"
        services.AddHttpClient("engine", (sp, client) =>
        {
            var engineOptions = configuration.GetSection("Engine").Get<EngineOptions>();
            if (!string.IsNullOrEmpty(engineOptions?.BaseUrl))
                client.BaseAddress = new Uri(engineOptions.BaseUrl);
        });

        // Repositories (intercambiables)
        services.AddScoped<IPlantRepository, PlantPostgresRepository>();
        services.AddScoped<IDashboardRepository, DashboardPostgresRepository>();

        // Ports → Adapters
        services.AddScoped<IPlantPort, PlantAdapter>();
        services.AddScoped<IFuelTypePort, FuelTypeAdapter>();
        services.AddScoped<IEmissionRecordPort, EmissionRecordAdapter>();
        services.AddScoped<IDashboardPort, DashboardAdapter>();

        return services;
    }
}
