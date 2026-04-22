using davi.Application.DTOs.EmissionRecords;
using davi.Application.UseCases.EmissionRecords;
using Microsoft.AspNetCore.Mvc;

namespace davi.web_api.Controllers;

[ApiController]
[Route("api/v1/emission-records")]
public class EmissionRecordsController(
    CreateEmissionRecordUseCase createUseCase,
    GetEmissionRecordsUseCase getAllUseCase,
    GetEmissionRecordByIdUseCase getByIdUseCase,
    AuditEmissionRecordUseCase auditUseCase,
    GetEmissionRecordHistoryUseCase historyUseCase,
    ExportEmissionRecordsUseCase exportUseCase) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType(typeof(EmissionRecordDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateEmissionRecordRequest request)
    {
        var result = await createUseCase.ExecuteAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] EmissionRecordFilters filters)
    {
        var result = await getAllUseCase.ExecuteAsync(filters);
        return Ok(result);
    }

    [HttpGet("export")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Export([FromQuery] ExportEmissionRecordFilters filters)
    {
        var result = await exportUseCase.ExecuteAsync(filters);
        return File(result.Content, result.ContentType, result.FileName);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(EmissionRecordDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(string id)
    {
        var result = await getByIdUseCase.ExecuteAsync(id);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPatch("{id}/audit")]
    [ProducesResponseType(typeof(EmissionRecordDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Audit(string id, [FromBody] AuditEmissionRecordRequest request)
    {
        var result = await auditUseCase.ExecuteAsync(id, request);
        return Ok(result);
    }

    [HttpGet("{id}/history")]
    [ProducesResponseType(typeof(IEnumerable<EmissionRecordHistoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHistory(string id)
    {
        var result = await historyUseCase.ExecuteAsync(id);
        return Ok(result);
    }
}
