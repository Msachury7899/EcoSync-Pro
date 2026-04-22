using davi.Domain.Entities;

namespace davi.Domain.Ports;

public interface IPlantPort
{
    Task<IEnumerable<Plant>> GetAllAsync();
    Task<Plant?> GetByIdAsync(string id);
}
