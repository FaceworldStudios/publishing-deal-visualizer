"use client";

import { useState } from "react";

const BODY = "var(--font-body), system-ui, sans-serif";

export default function CopyLinkButton({ dark = false }: { dark?: boolean }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={copy}
      style={{
        fontFamily: BODY,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.03em",
        padding: "7px 16px",
        borderRadius: 8,
        border: dark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #E0DDD8",
        background: "transparent",
        color: dark ? "rgba(255,255,255,0.5)" : "#7A7570",
        cursor: "pointer",
      }}
    >
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}
