using davi.Application.DTOs.FuelTypes;
using davi.Application.UseCases.FuelTypes;
using Microsoft.AspNetCore.Mvc;

namespace davi.web_api.Controllers;

[ApiController]
[Route("api/v1/fuel-types")]
public class FuelTypesController(
    GetFuelTypesUseCase getFuelTypesUseCase,
    GetFuelTypeByIdUseCase getFuelTypeByIdUseCase) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<FuelTypeDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var result = await getFuelTypesUseCase.ExecuteAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(FuelTypeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(string id)
    {
        var result = await getFuelTypeByIdUseCase.ExecuteAsync(id);
        return result is null ? NotFound() : Ok(result);
    }
}
