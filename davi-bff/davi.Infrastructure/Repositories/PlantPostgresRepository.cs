using davi.Domain.Entities;
using davi.Domain.Repositories;
using davi.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace davi.Infrastructure.Repositories;

public class PlantPostgresRepository(BffDbContext dbContext) : IPlantRepository
{
    public async Task<IEnumerable<Plant>> GetAllAsync()
        => await dbContext.Plants.AsNoTracking().ToListAsync();

    public async Task<Plant?> GetByIdAsync(string id)
        => await dbContext.Plants.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
}
