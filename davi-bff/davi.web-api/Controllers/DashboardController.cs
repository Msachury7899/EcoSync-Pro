using davi.Application.DTOs.Dashboard;
using davi.Application.UseCases.Dashboard;
using Microsoft.AspNetCore.Mvc;

namespace davi.web_api.Controllers;

[ApiController]
[Route("api/v1/dashboard")]
public class DashboardController(
    GetComplianceUseCase complianceUseCase,
    GetTrendUseCase trendUseCase,
    GetFuelBreakdownUseCase fuelBreakdownUseCase,
    GetSummaryUseCase summaryUseCase) : ControllerBase
{
    [HttpGet("compliance")]
    [ProducesResponseType(typeof(ComplianceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCompliance([FromQuery] string plantId, [FromQuery] int year)
    {
        if (string.IsNullOrWhiteSpace(plantId) || year < 2000)
            return BadRequest("plantId and year are required.");
        try
        {
            var result = await complianceUseCase.ExecuteAsync(plantId, year);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpGet("trend")]
    [ProducesResponseType(typeof(TrendResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetTrend([FromQuery] string plantId, [FromQuery] string month)
    {
        if (string.IsNullOrWhiteSpace(plantId) || string.IsNullOrWhiteSpace(month))
            return BadRequest("plantId and month are required.");
        var result = await trendUseCase.ExecuteAsync(plantId, month);
        return Ok(result);
    }

    [HttpGet("fuel-breakdown")]
    [ProducesResponseType(typeof(FuelBreakdownResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetFuelBreakdown([FromQuery] string plantId, [FromQuery] string month)
    {
        if (string.IsNullOrWhiteSpace(plantId) || string.IsNullOrWhiteSpace(month))
            return BadRequest("plantId and month are required.");
        var result = await fuelBreakdownUseCase.ExecuteAsync(plantId, month);
        return Ok(result);
    }

    [HttpGet("summary")]
    [ProducesResponseType(typeof(SummaryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetSummary([FromQuery] string plantId, [FromQuery] string month)
    {
        if (string.IsNullOrWhiteSpace(plantId) || string.IsNullOrWhiteSpace(month))
            return BadRequest("plantId and month are required.");
        var result = await summaryUseCase.ExecuteAsync(plantId, month);
        return Ok(result);
    }
}
