using davi.Domain.Entities;

namespace davi.Domain.Repositories;

public interface IPlantRepository
{
    Task<IEnumerable<Plant>> GetAllAsync();
    Task<Plant?> GetByIdAsync(string id);
}
