const express = require('express');
const multer = require('multer');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const upload = multer({ dest: os.tmpdir() });

app.post('/convert', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  
  if (ext !== '.pdf' && ext !== '.docx') {
    fs.unlinkSync(req.file.path);
    return res.status(400).send('Unsupported file type. Only PDF and DOCX are supported.');
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
    res.set('Content-Type', 'text/markdown; charset=utf-8');
    res.send(result);
  } catch (err) {
    res.status(500).send(err.message);
  } finally {
    fs.unlinkSync(tmpPath);
  }
});

app.get('/health', (req, res) => {
  res.send('ok');
});

function convertPDF(filePath) {
  const pythonScript = `
import sys
import os
import io

old_stdout = sys.stdout
sys.stdout = io.StringIO()

import pymupdf4llm

sys.stdout = old_stdout

md_text = pymupdf4llm.to_markdown(sys.argv[1], show_progress=False)
print(md_text, end="")
`;
  return execSync(`python3 -c '${pythonScript}' "${filePath}"`, { encoding: 'utf-8' });
}

function convertDocx(filePath) {
  const pandocPath = process.env.PANDOC_PATH || '/opt/pandoc-3.8.2.1/bin/pandoc';
  return execSync(`"${pandocPath}" -f docx -t gfm "${filePath}"`, { encoding: 'utf-8' });
}

const port = process.env.PORT || 5003;
app.listen(port, () => {
  console.log(`Server starting on port ${port}`);
});
