# Parser Microservice

A microservice for converting PDF and DOCX files to Markdown.

## Running

```bash
docker-compose up --build
```

Server starts at `http://localhost:5002`

## API

### POST /convert
Converts PDF or DOCX to Markdown. File type is detected automatically.

### GET /health
Health check endpoint.

