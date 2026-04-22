using davi.Domain.Entities;
using davi.Domain.Ports;
using davi.Domain.Repositories;

namespace davi.Infrastructure.HttpAdapters;

public class PlantAdapter(IPlantRepository repository) : IPlantPort
{
    public Task<IEnumerable<Plant>> GetAllAsync() => repository.GetAllAsync();

    public Task<Plant?> GetByIdAsync(string id) => repository.GetByIdAsync(id);
}
