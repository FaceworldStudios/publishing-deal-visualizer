"use client";

import { useState, useRef, DragEvent } from "react";
import { useRouter } from "next/navigation";

const BODY = "var(--font-body), system-ui, sans-serif";
const DISPLAY = "var(--font-display), sans-serif";

export default function UploadForm() {
  const [mode, setMode] = useState<"file" | "text">("file");
  const [text, setText] = useState("");
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function submit(file?: File) {
    setError(null);
    setLoading(true);
    try {
      const form = new FormData();
      if (mode === "file" && file) {
        form.append("file", file);
      } else if (mode === "file" && fileRef.current?.files?.[0]) {
        form.append("file", fileRef.current.files[0]);
      } else {
        form.append("text", text);
      }

      const res = await fetch("/api/parse-deal", { method: "POST", body: form });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Something went wrong.");
        return;
      }

      router.push(`/deal/${json.id}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setFileName(file.name);
      submit(file);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 4, background: "#F7F5F0", borderRadius: 8, padding: 4, width: "fit-content" }}>
        {(["file", "text"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              fontFamily: BODY,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.03em",
              padding: "6px 16px",
              borderRadius: 6,
              border: "none",
              background: mode === m ? "#1A1814" : "transparent",
              color: mode === m ? "#F7F5F0" : "#7A7570",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {m === "file" ? "Upload PDF" : "Paste Text"}
          </button>
        ))}
      </div>

      {mode === "file" ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? "#A8A4A0" : "#E0DDD8"}`,
            borderRadius: 10,
            padding: "48px 24px",
            textAlign: "center",
            cursor: "pointer",
            background: dragging ? "#EFEDE8" : "transparent",
            transition: "all 0.15s ease",
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setFileName(file.name);
            }}
          />
          <p style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 700, color: "#A8A4A0", margin: "0 0 8px", lineHeight: 1 }}>PDF</p>
          {fileName ? (
            <p style={{ fontFamily: BODY, fontSize: 13, fontWeight: 600, color: "#1A1814", margin: 0 }}>{fileName}</p>
          ) : (
            <>
              <p style={{ fontFamily: BODY, fontSize: 13, fontWeight: 500, color: "#7A7570", margin: "0 0 4px" }}>
                Drop a PDF here or click to browse
              </p>
              <p style={{ fontFamily: BODY, fontSize: 11, color: "#A8A4A0", margin: 0 }}>PDF files only</p>
            </>
          )}
        </div>
      ) : (
        <textarea
          style={{
            fontFamily: BODY,
            width: "100%",
            height: 220,
            fontSize: 13,
            border: "1px solid #E0DDD8",
            borderRadius: 10,
            padding: 16,
            background: "#F7F5F0",
            color: "#1A1814",
            resize: "none",
            outline: "none",
            lineHeight: 1.6,
          }}
          placeholder="Paste contract text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      )}

      {error && (
        <div style={{ border: "1px solid #E0DDD8", background: "#EFEDE8", borderRadius: 8, padding: "12px 16px", fontFamily: BODY, fontSize: 13, color: "#7A6040" }}>
          {error}
        </div>
      )}

      <button
        disabled={loading || (mode === "text" && text.trim().length === 0)}
        onClick={() => submit()}
        style={{
          fontFamily: BODY,
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.02em",
          width: "100%",
          padding: "13px 24px",
          borderRadius: 10,
          border: "none",
          background: "#1B4F6B",
          color: "#EEF4F8",
          cursor: loading || (mode === "text" && text.trim().length === 0) ? "not-allowed" : "pointer",
          opacity: loading || (mode === "text" && text.trim().length === 0) ? 0.5 : 1,
          transition: "opacity 0.15s ease",
        }}
      >
        {loading ? "Analysing contract…" : "Generate Deal Summary"}
      </button>
    </div>
  );
}
