# Parser Tool

A tool for converting PDF and DOCX files to Markdown.

## Running

```bash
docker build -t parser .
docker run -p 5004:5004 -e API_TOKEN=your-secret-token parser
```

Server starts at `http://localhost:5004`

## API

### POST /convert
Converts PDF or DOCX to Markdown. File type is detected automatically.

**Authentication:** Requires Bearer token in `Authorization` header or `token` query parameter.

**Example:**
```bash
curl -X POST \
  -H "Authorization: Bearer your-secret-token" \
  -F "file=@document.pdf" \
  http://localhost:5003/convert
```

### GET /health
Health check endpoint (no authentication required).

## License

AGPL-3.0
