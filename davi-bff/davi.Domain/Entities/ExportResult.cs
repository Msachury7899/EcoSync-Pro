namespace davi.Domain.Entities;

public class ExportResult
{
    public byte[] Content { get; set; } = [];
    public string ContentType { get; set; } = "text/csv";
    public string FileName { get; set; } = "export.csv";
}
