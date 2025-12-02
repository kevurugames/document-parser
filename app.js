const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const rawParser = express.raw({ type: () => true, limit: '50mb' });

const API_TOKEN = process.env.DOCUMENT_PARSER_API_TOKEN;

function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '') || req.query.token;

  if (!API_TOKEN) {
    return res.status(500).json({ error: 'Server misconfigured: API_TOKEN not set' });
  }

  if (!token || token !== API_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.post('/convert', authenticateToken, rawParser, (req, res) => {
  if (!req.body || !req.body.length) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const mime = req.headers['content-type'] || '';
  let ext = '';

  if (mime === 'application/pdf') {
    ext = '.pdf';
  } else if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    ext = '.docx';
  } else {
    return res.status(400).json({ error: 'Unsupported file type. Only PDF and DOCX are supported.' });
  }

  const tmpPath = path.join(
    os.tmpdir(),
    `upload-${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`
  );

  fs.writeFileSync(tmpPath, req.body);

  try {
    let result;
    switch (ext) {
      case '.pdf':
        result = convertPDF(tmpPath);
        break;
      case '.docx':
        result = convertDocx(tmpPath);
        break;
    }

    res.json({ content: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    fs.unlinkSync(tmpPath);
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

function convertPDF(filePath) {
  return execSync(`python3 convert_pdf.py "${filePath}"`, { encoding: 'utf-8' });
}

function convertDocx(filePath) {
  const pandocPath = process.env.PANDOC_PATH || '/opt/pandoc-3.8.2.1/bin/pandoc';
  return execSync(`"${pandocPath}" -f docx -t gfm "${filePath}"`, { encoding: 'utf-8' });
}

const port = 5004;
app.listen(port, () => {
  console.log(`Server starting on port ${port}`);
});
