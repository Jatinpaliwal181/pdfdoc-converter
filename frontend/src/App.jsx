// frontend/src/App.jsx
import { useState } from 'react';

export default function App() {
  const [file, setFile] = useState(null);
  const [direction, setDirection] = useState('docx-to-pdf');
  const [status, setStatus] = useState('');
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [downloadName, setDownloadName] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert('Choose a file');

    setStatus('Uploading...');
    setDownloadUrl(null);

    const form = new FormData();
    form.append('file', file);
    form.append('direction', direction);

    try {
      // point to your backend origin in production
      const res = await fetch('/convert', {
        method: 'POST',
        body: form
      });

      if (!res.ok) {
        const err = await res.json().catch(()=>null);
        setStatus('Error: ' + (err?.error || res.statusText));
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      const ext = direction === 'docx-to-pdf' ? '.pdf' : '.docx';
      const base = file.name.replace(/\.[^/.]+$/, '');
      setDownloadName(base + ext);
      setStatus('Done — click download');
    } catch (err) {
      console.error(err);
      setStatus('Upload/convert failed: ' + err.message);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>DOC ↔ PDF Converter</h1>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 12 }}>
          <input type="file" accept=".doc,.docx,.pdf" onChange={e => setFile(e.target.files?.[0])} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <select value={direction} onChange={e => setDirection(e.target.value)}>
            <option value="docx-to-pdf">DOCX → PDF</option>
            <option value="pdf-to-docx">PDF → DOCX</option>
          </select>
        </div>
        <div>
          <button type="submit">Convert</button>
        </div>
      </form>

      <div style={{ marginTop: 20 }}>
        <strong>Status:</strong> {status}
      </div>

      {downloadUrl && (
        <div style={{ marginTop: 12 }}>
          <a href={downloadUrl} download={downloadName}>Download {downloadName}</a>
        </div>
      )}
    </div>
  );
}
