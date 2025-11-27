# Parser Tool

A tool for converting PDF and DOCX files to Markdown.

## Running

```bash
docker build -t parser .
docker run -p 5003:5003 parser
```

Server starts at `http://localhost:5003`

## API

### POST /convert
Converts PDF or DOCX to Markdown. File type is detected automatically.

### GET /health
Health check endpoint.

## License

AGPL-3.0
