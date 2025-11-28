const express = require('express');
const multer = require('multer');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const upload = multer({ dest: os.tmpdir() });

const API_TOKEN = 'eyJpc3MiOiJodHRwczovL2V4YW1wbGUuYXV0aDAuY29';

function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '') || req.query.token;
  
  if (!token || token !== API_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.post('/convert', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  
  if (ext !== '.pdf' && ext !== '.docx') {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Unsupported file type. Only PDF and DOCX are supported.' });
  }

  const tmpPath = req.file.path + ext;
  fs.renameSync(req.file.path, tmpPath);

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
    res.json({ 
      content: result 
    });
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

const port = process.env.PORT || 5004;
app.listen(port, () => {
  console.log(`Server starting on port ${port}`);
});
