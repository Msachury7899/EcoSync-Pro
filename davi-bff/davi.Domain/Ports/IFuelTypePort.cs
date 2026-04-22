using davi.Domain.Entities;

namespace davi.Domain.Ports;

public interface IFuelTypePort
{
    Task<IEnumerable<FuelType>> GetAllAsync();
    Task<FuelType?> GetByIdAsync(string id);
}
