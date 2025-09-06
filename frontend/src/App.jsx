import { useRef, useState, useCallback } from "react";
import "./index.css";

const ACCEPTED = ".doc,.docx,.pdf";

function Logo() {
  return (
    <div className="logo">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="2" y="3" width="20" height="18" rx="3" fill="#1fd07a"/>
      </svg>
      <span className="logo-text">FileConverter</span>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3v10" stroke="#9aa6b2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 7l4-4 4 4" stroke="#9aa6b2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="3" y="9" width="18" height="12" rx="2" stroke="#334155" strokeWidth="1.6" fill="none"/>
    </svg>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("doc-to-pdf"); // "pdf-to-doc" | "doc-to-pdf"
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [downloadName, setDownloadName] = useState("");
  const [uploading, setUploading] = useState(false);

  const inputRef = useRef();

  const onFile = useCallback((f) => {
    setFile(f);
    setDownloadUrl(null);
    setStatus("");
  }, []);

  const handleFiles = (files) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    // simple validation
    const allowed = [".doc", ".docx", ".pdf"];
    const ext = (f.name.match(/\.[^.]+$/) || [""])[0].toLowerCase();
    if (!allowed.includes(ext)) {
      setStatus("Unsupported file type. Use .doc, .docx or .pdf");
      return;
    }
    onFile(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onClickChoose = () => {
    inputRef.current && inputRef.current.click();
  };

  const onSubmit = async (e) => {
    e && e.preventDefault();
    if (!file) return setStatus("Choose a file first");

    setStatus("Uploading...");
    setUploading(true);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("direction", activeTab === "doc-to-pdf" ? "docx-to-pdf" : "pdf-to-docx");

      const res = await fetch("/convert", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        let errText = res.statusText;
        try {
          const json = await res.json();
          errText = json?.error || errText;
        } catch {}
        setStatus("Error: " + errText);
        setUploading(false);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const ext = activeTab === "doc-to-pdf" ? ".pdf" : ".docx";
      const base = file.name.replace(/\.[^/.]+$/, "");
      setDownloadUrl(url);
      setDownloadName(base + ext);
      setStatus("Conversion ready");
    } catch (err) {
      console.error(err);
      setStatus("Conversion failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Logo />
          <nav className="tabs">
            <button className={`tab ${activeTab === "pdf-to-doc" ? "active" : ""}`} onClick={() => { setActiveTab("pdf-to-doc"); setFile(null); setDownloadUrl(null); }}>
              PDF to DOC
            </button>
            <button className={`tab ${activeTab === "doc-to-pdf" ? "active" : ""}`} onClick={() => { setActiveTab("doc-to-pdf"); setFile(null); setDownloadUrl(null); }}>
              DOC to PDF
            </button>
          </nav>
        </div>
      </header>

      <main className="hero">
        <h1 className="hero-title">{activeTab === "doc-to-pdf" ? "Convert DOC to PDF" : "Convert PDF to DOC"}</h1>
        <p className="hero-sub">Easily convert your {activeTab === "doc-to-pdf" ? "Word documents to high-quality PDFs." : "PDFs to editable Word documents."} Drag and drop your file to get started.</p>

        <form className="dropzone-wrap" onSubmit={onSubmit}>
          <div
            className="dropzone"
            onDrop={onDrop}
            onDragOver={onDragOver}
            role="button"
            tabIndex={0}
            onKeyDown={() => {}}
          >
            <div className="dropzone-inner">
              <UploadIcon />
              <h3 className="drop-title">Drag &amp; drop your {activeTab === "doc-to-pdf" ? "DOC" : "PDF"} file here</h3>
              <div className="or-text">or</div>

              <button type="button" className="choose-btn" onClick={onClickChoose} aria-label="Choose file">
                <span className="plus">+</span> Choose a file
              </button>

              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED}
                style={{ display: "none" }}
                onChange={(e) => handleFiles(e.target.files)}
              />

              <div className="status-area">
                {file && <div className="file-name">Selected: {file.name}</div>}
                <div className="status-text">{status}</div>
                <div className="controls">
                  <button type="button" className="convert-btn" onClick={onSubmit} disabled={uploading || !file}>
                    {uploading ? "Converting..." : (activeTab === "doc-to-pdf" ? "Convert to PDF" : "Convert to DOC")}
                  </button>
                </div>

                {downloadUrl && (
                  <div className="download-row">
                    <a className="download-link" href={downloadUrl} download={downloadName}>
                      Download {downloadName}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="footer-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="lock-icon" aria-hidden>
              <path d="M6 10v-2a6 6 0 1112 0v2" stroke="#6b7280" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="4" y="10" width="16" height="10" rx="2" stroke="#374151" strokeWidth="1.4" fill="none"/>
            </svg>
            <span>Your files are secure. We delete them from our servers after 2 hours.</span>
          </div>
        </form>
      </main>

      <footer className="site-footer">© 2024 FileConverter</footer>
    </div>
  );
}
