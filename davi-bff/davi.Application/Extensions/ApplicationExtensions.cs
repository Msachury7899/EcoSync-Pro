using davi.Application.UseCases.Dashboard;
using davi.Application.UseCases.EmissionRecords;
using davi.Application.UseCases.FuelTypes;
using davi.Application.UseCases.Plants;
using Microsoft.Extensions.DependencyInjection;

namespace davi.Application.Extensions;

public static class ApplicationExtensions
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // Plants
        services.AddScoped<GetPlantsUseCase>();
        services.AddScoped<GetPlantByIdUseCase>();

        // FuelTypes
        services.AddScoped<GetFuelTypesUseCase>();
        services.AddScoped<GetFuelTypeByIdUseCase>();

        // EmissionRecords
        services.AddScoped<CreateEmissionRecordUseCase>();
        services.AddScoped<GetEmissionRecordsUseCase>();
        services.AddScoped<GetEmissionRecordByIdUseCase>();
        services.AddScoped<AuditEmissionRecordUseCase>();
        services.AddScoped<GetEmissionRecordHistoryUseCase>();
        services.AddScoped<ExportEmissionRecordsUseCase>();

        // Dashboard
        services.AddScoped<GetComplianceUseCase>();
        services.AddScoped<GetTrendUseCase>();
        services.AddScoped<GetFuelBreakdownUseCase>();
        services.AddScoped<GetSummaryUseCase>();

        return services;
    }
}
