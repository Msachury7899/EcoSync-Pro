namespace davi.Domain.Entities;

public class PaginatedResult<T>
{
    public IEnumerable<T> Data { get; set; } = [];
    public int Page { get; set; }
    public int Limit { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages => Limit > 0 ? (int)Math.Ceiling((double)TotalCount / Limit) : 0;
}
