using davi.Application.DTOs.Plants;
using davi.Application.UseCases.Plants;
using Microsoft.AspNetCore.Mvc;

namespace davi.web_api.Controllers;

[ApiController]
[Route("api/v1/plants")]
public class PlantsController(
    GetPlantsUseCase getPlantsUseCase,
    GetPlantByIdUseCase getPlantByIdUseCase) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<PlantDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var result = await getPlantsUseCase.ExecuteAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(PlantDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(string id)
    {
        try
        {
            var result = await getPlantByIdUseCase.ExecuteAsync(id);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
