"use client";

import { useState } from "react";
import { DealData } from "@/lib/types";
import DealSummary from "@/components/DealSummary";
import CopyLinkButton from "@/components/CopyLinkButton";

const BODY = "var(--font-body), system-ui, sans-serif";

interface Props {
  id: string;
  data: DealData;
}

export default function DealPageClient({ id, data }: Props) {
  const [mode, setMode] = useState<"minimal" | "wrapped">("minimal");

  return (
    <>
      {/* Mode bar — sticky top */}
      <div style={{
        background: "#0A0A0A",
        position: "sticky",
        top: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px 24px",
      }}>
        <div style={{
          background: "rgba(255,255,255,0.07)",
          borderRadius: 100,
          padding: 3,
          display: "flex",
          gap: 2,
        }}>
          {(["minimal", "wrapped"] as const).map((m) => {
            const active = mode === m;
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  fontFamily: BODY,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "6px 20px",
                  borderRadius: 100,
                  border: "none",
                  background: active
                    ? m === "minimal" ? "#F7F5F0" : "#C8F064"
                    : "transparent",
                  color: active
                    ? m === "minimal" ? "#1A1814" : "#0A0A0A"
                    : "rgba(255,255,255,0.35)",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                }}
              >
                {m === "minimal" ? "Minimal" : "Wrapped"}
              </button>
            );
          })}
        </div>
      </div>

      <main style={{ background: mode === "minimal" ? "#F7F5F0" : "#0A0A0A", minHeight: "100vh" }}>
        {/* Nav */}
        <div style={{
          padding: "0 24px",
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: mode === "minimal" ? 680 : 480,
          margin: "0 auto",
          width: "100%",
          borderBottom: mode === "minimal" ? "1px solid #E0DDD8" : "1px solid rgba(255,255,255,0.06)",
        }}>
          <span style={{
            fontFamily: BODY,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: mode === "minimal" ? "#7A7570" : "rgba(255,255,255,0.4)",
          }}>
            GPS
          </span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <CopyLinkButton dark={mode === "wrapped"} />
            <a
              href={`/api/export-pdf/${id}`}
              style={{
                fontFamily: BODY,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.03em",
                padding: "7px 16px",
                borderRadius: 8,
                background: "#1B4F6B",
                color: "#EEF4F8",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Download PDF
            </a>
          </div>
        </div>

        <DealSummary data={data} mode={mode} />
      </main>
    </>
  );
}
