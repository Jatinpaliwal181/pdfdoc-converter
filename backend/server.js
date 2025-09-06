// backend/server.js
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const CloudConvert = require('cloudconvert');
const fetch = require('node-fetch');

const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit
const app = express();

if (!process.env.CLOUDCONVERT_API_KEY) {
  console.error('Missing CLOUDCONVERT_API_KEY in environment');
  process.exit(1);
}
const cc = new CloudConvert(process.env.CLOUDCONVERT_API_KEY);

app.post('/convert', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const direction = req.body.direction || 'docx-to-pdf';
    // set output format based on the direction
    const outputFormat = direction === 'docx-to-pdf' ? 'pdf' : 'docx';

    // create a job: import -> convert -> export
    const job = await cc.jobs.create({
      tasks: {
        'import-my-file': { operation: 'import/upload' },
        'convert-my-file': {
          operation: 'convert',
          input: ['import-my-file'],
          output_format: outputFormat,
          // You can specify converter options here if needed
        },
        'export-my-file': {
          operation: 'export/url',
          input: ['convert-my-file']
        }
      }
    });

    // find upload task and upload the file
    const uploadTask = job.tasks.find(t => t.name === 'import-my-file');
    const uploadTaskId = uploadTask.id;

    // Upload using SDK helper
    await cc.tasks.upload(uploadTask, req.file.buffer, req.file.originalname);

    // wait for job to finish
    const finished = await cc.jobs.wait(job.id);

    // get exported file URL
    const exportTask = finished.tasks.find(t => t.operation === 'export/url' && t.status === 'finished');
    if (!exportTask || !exportTask.result || !exportTask.result.files || exportTask.result.files.length === 0) {
      return res.status(500).json({ error: 'No output file found' });
    }
    const fileUrl = exportTask.result.files[0].url;

    // stream result back to client
    const resp = await fetch(fileUrl);
    const contentType = resp.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    const ext = outputFormat;
    const baseName = req.file.originalname.replace(/\.[^/.]+$/, '');
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}.${ext}"`);
    resp.body.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Conversion failed', details: err.message });
  }
});

app.get('/', (req, res) => res.send('Converter backend running'));
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
