import UploadForm from "@/components/UploadForm";

export default function UploadPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#F7F5F0", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 80, paddingLeft: 24, paddingRight: 24 }}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        {/* Nav */}
        <div style={{ marginBottom: 40, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "var(--font-body), system-ui, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7A7570" }}>
            GPS
          </span>
        </div>
        {/* Heading */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "var(--font-display), sans-serif", fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", color: "#1A1814", margin: "0 0 8px", lineHeight: 1.1 }}>
            Deal Memo Visualizer
          </h1>
          <p style={{ fontFamily: "var(--font-body), system-ui, sans-serif", fontSize: 14, color: "#7A7570", margin: 0, lineHeight: 1.6 }}>
            Upload a publishing deal PDF or paste contract text to generate a visual summary.
          </p>
        </div>
        {/* Form card */}
        <div style={{ background: "#EFEDE8", borderRadius: 12, border: "1px solid #E0DDD8", padding: 24 }}>
          <UploadForm />
        </div>
      </div>
    </main>
  );
}
