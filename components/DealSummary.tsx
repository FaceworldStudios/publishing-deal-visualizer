"use client";

import React, { useState } from "react";
import { DealData } from "@/lib/types";
import { motion, useReducedMotion, type MotionProps } from "framer-motion";
import {
  PenNib, ArrowsClockwise, DoorOpen, TrendUp, BookBookmark,
  Percent, Money, Key, Door, MusicNotes, CalendarCheck,
  HandCoins, ArrowFatLinesUp, MusicNote, Receipt,
  ClockCountdown, CurrencyDollar, Vault,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";

// ── Fonts ─────────────────────────────────────────────────────────────────────
const DISPLAY = "var(--font-display), sans-serif";
const BODY    = "var(--font-body), system-ui, sans-serif";

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  pageBg:    "#F7F5F0",
  cardBg:    "#EFEDE8",
  text:      "#1A1814",
  secondary: "#7A7570",
  muted:     "#A8A4A0",
  border:    "#E0DDD8",
  trust:     "#1B4F6B",
  green:     "#1A6B4A",
  caution:   "#7A6040",
  neutral:   "#6B6560",
};

const BAR_DURING = "linear-gradient(90deg,#1A6B4A,#2A9D6E)";
const BAR_AFTER  = "linear-gradient(90deg,#0F4A32,#1A6B4A)";
const TGL_DURING = "linear-gradient(135deg,#1A6B4A,#2A9D6E)";
const TGL_AFTER  = "linear-gradient(135deg,#0F4A32,#1A6B4A)";

const CARD_GRAD = [
  "linear-gradient(135deg,#E8EEF2,#F0F5F7)",
  "linear-gradient(135deg,#D4EBE0,#E8F5EE)",
  "linear-gradient(135deg,#E8F0EC,#F2F7F4)",
  "linear-gradient(135deg,#EFEDE8,#F5F3EF)",
];

const PRIORITY_STYLE: Record<string, { bg: string; text: string }> = {
  Critical:   { bg: "#FFE8D6", text: "#B05C1A" },
  High:       { bg: "#D4EBE0", text: C.green   },
  Supporting: { bg: C.cardBg,  text: C.neutral  },
  Context:    { bg: C.cardBg,  text: C.neutral  },
};

const TL_CONFIG: Array<{ label: string; color: string; Icon: PhosphorIcon }> = [
  { label: "Signing",           color: "#1B4F6B", Icon: PenNib          },
  { label: "Rollover Window",   color: "#1A6B4A", Icon: ArrowsClockwise },
  { label: "Early Exit",        color: "#6B6560", Icon: DoorOpen        },
  { label: "Royalties Improve", color: "#B05C1A", Icon: TrendUp         },
  { label: "Catalog Return",    color: "#A8A4A0", Icon: BookBookmark    },
];

const SUMMARY_CONFIG: Array<{ circle: string; Icon: PhosphorIcon; badge: string }> = [
  { circle: "#1B4F6B", Icon: Percent,       badge: "Critical"   },
  { circle: "#1A6B4A", Icon: Money,         badge: "Critical"   },
  { circle: "#1A6B4A", Icon: Key,           badge: "Critical"   },
  { circle: "#6B6560", Icon: Door,          badge: "High"       },
  { circle: "#1A6B4A", Icon: TrendUp,       badge: "High"       },
  { circle: "#6B6560", Icon: MusicNotes,    badge: "Supporting" },
  { circle: "#6B6560", Icon: CalendarCheck, badge: "Context"    },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function wLimit(s: string | null | undefined, n: number): string {
  if (!s || s.trim() === "" || s === "—") return "—";
  return s.trim().split(/\s+/).slice(0, n).join(" ");
}

function usd(val: number | null | undefined): string {
  if (val == null || val === 0) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
}

function usdK(val: number | null | undefined): string {
  if (val == null || val === 0) return "—";
  if (val >= 1000) return `$${Math.round(val / 1000)}k`;
  return usd(val);
}

function pct(val: number | null): string {
  if (val === null) return "—";
  return `${val}%`;
}

function cleanType(s: string): string {
  return s.replace(/\bincome\b/gi, "").replace(/\s{2,}/g, " ").trim();
}

type RoyRow = NonNullable<DealData["royalties"]>[number];

function avgPct(rows: RoyRow[], key: "during_term_pct" | "post_term_pct"): number {
  if (!rows.length) return 0;
  return Math.round(rows.reduce((s, r) => s + r[key], 0) / rows.length);
}

// ── Shared atoms ──────────────────────────────────────────────────────────────
function Divider() {
  return <div style={{ borderTop: `1px solid ${C.border}`, margin: "40px 0" }} />;
}

function SectionNum({ num }: { num: string }) {
  return (
    <span style={{ fontFamily: DISPLAY, fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", color: C.trust }}>
      {num}
    </span>
  );
}

function SectionLabel({ title }: { title: string }) {
  return (
    <span style={{ fontFamily: BODY, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.text }}>
      {title}
    </span>
  );
}

function SectionHeader({ num, title }: { num: string; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
      <SectionNum num={num} />
      <SectionLabel title={title} />
    </div>
  );
}

function PriorityBadge({ level }: { level: string }) {
  const s = PRIORITY_STYLE[level] ?? PRIORITY_STYLE.Context;
  return (
    <span style={{
      fontFamily: BODY, fontSize: 10, fontWeight: 600, letterSpacing: "0.09em",
      textTransform: "uppercase", background: s.bg, color: s.text,
      borderRadius: 100, padding: "3px 9px", flexShrink: 0,
    }}>
      {level}
    </span>
  );
}

function KVRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "baseline",
      gap: 16, paddingBottom: 11, marginBottom: 11, borderBottom: `1px solid ${C.border}`,
    }}>
      <span style={{ fontFamily: BODY, fontSize: 12, color: C.muted, flexShrink: 0 }}>{label}</span>
      <span style={{ fontFamily: BODY, fontSize: 13, fontWeight: 600, color: C.text, textAlign: "right" }}>{value ?? "—"}</span>
    </div>
  );
}

// ── Royalty bar (minimal) ─────────────────────────────────────────────────────
function RoyaltyBarMinimal({
  label, pctVal, pctRight, gradient, index, view, reduced,
}: {
  label: string; pctVal: number; pctRight: number; gradient: string;
  index: number; view: string; reduced: boolean | null;
}) {
  const showOutside = (100 - pctVal) >= 12;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 12 }}>
      <div style={{ position: "relative", height: 56, borderRadius: 10, background: C.cardBg, overflow: "hidden" }}>
        <motion.div
          key={`${view}-${index}`}
          initial={{ width: reduced ? `${pctVal}%` : "0%" }}
          animate={{ width: `${pctVal}%` }}
          transition={reduced ? { duration: 0 } : { duration: 0.5, ease: "easeOut", delay: index * 0.08 }}
          style={{
            position: "absolute", left: 0, top: 0, bottom: 0,
            background: gradient, borderRadius: 8, overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "flex-end",
            paddingRight: 14,
          }}
        >
          <span style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>
            {pctVal}%
          </span>
        </motion.div>
        {showOutside && (
          <div style={{ position: "absolute", right: 12, top: 0, bottom: 0, display: "flex", alignItems: "center", pointerEvents: "none" }}>
            <span style={{ fontFamily: BODY, fontSize: 12, fontWeight: 500, color: "#B0ACA8" }}>
              {label} {pctVal}%
            </span>
          </div>
        )}
      </div>
      <span style={{ fontFamily: DISPLAY, fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", color: C.green, minWidth: 44, textAlign: "right" }}>
        {pctRight}%
      </span>
    </div>
  );
}

// ── Timeline (shared) ────────────────────────────────────────────────────────
interface TLNode { label: string; timeframe: string; description: string; color: string; Icon: PhosphorIcon }

function VerticalTimeline({ nodes, reduced, dark }: { nodes: TLNode[]; reduced: boolean | null; dark?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {nodes.map((node, i) => {
        const isLast = i === nodes.length - 1;
        const anim: MotionProps = reduced ? {} : {
          initial: { opacity: 0, x: -10 }, animate: { opacity: 1, x: 0 },
          transition: { duration: 0.35, ease: "easeOut", delay: i * 0.1 },
        };
        return (
          <motion.div key={i} {...anim} style={{ display: "grid", gridTemplateColumns: "100px 28px 1fr", gap: "0 14px", alignItems: "start" }}>
            <div style={{ textAlign: "right", paddingTop: 3 }}>
              {node.timeframe !== "—" && (
                <span style={{
                  fontFamily: BODY, fontSize: 10, fontWeight: 600,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  color: dark ? "rgba(255,255,255,0.35)" : C.muted,
                  lineHeight: 1.4, display: "block",
                }}>
                  {node.timeframe}
                </span>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%", background: node.color,
                flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <node.Icon size={11} weight="fill" color="#fff" />
              </div>
              {!isLast && (
                <div style={{
                  width: 2, flex: 1, minHeight: 24,
                  background: dark ? "rgba(255,255,255,0.08)" : C.border,
                  marginTop: 4,
                }} />
              )}
            </div>
            <div style={{ paddingBottom: isLast ? 0 : 32 }}>
              <p style={{
                fontFamily: DISPLAY, fontSize: dark ? 16 : 17, fontWeight: 700,
                letterSpacing: "-0.01em",
                color: dark ? "#fff" : C.text,
                margin: "0 0 4px", lineHeight: 1.2,
              }}>
                {node.label}
              </p>
              <p style={{
                fontFamily: BODY, fontSize: 12,
                color: dark ? "rgba(255,255,255,0.45)" : C.secondary,
                margin: 0, lineHeight: 1.5,
              }}>
                {node.description}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Plain English item (shared) ───────────────────────────────────────────────
function SummaryItem({
  cfgIndex, question, answer, isLast, dark,
}: {
  cfgIndex: number; question: string; answer: string; isLast?: boolean; dark?: boolean;
}) {
  const cfg = SUMMARY_CONFIG[cfgIndex];
  return (
    <div style={{
      display: "flex", gap: 20, padding: "28px 0",
      borderBottom: isLast ? "none" : `1px solid ${dark ? "rgba(255,255,255,0.08)" : C.border}`,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%", background: cfg.circle,
        flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
        marginTop: 2,
      }}>
        <cfg.Icon size={15} weight="bold" color="#fff" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
          <p style={{ fontFamily: BODY, fontSize: 13, fontWeight: 600, color: dark ? "#F7F5F0" : C.text, margin: 0 }}>
            {question}
          </p>
        </div>
        <p style={{
          fontFamily: BODY, fontSize: 12,
          color: dark ? "rgba(255,255,255,0.55)" : C.secondary,
          margin: 0, lineHeight: 1.55,
        }}>
          {answer}
        </p>
      </div>
    </div>
  );
}

// ── Royalty toggle ─────────────────────────────────────────────────────────────
function RoyaltyToggle({
  activeView, setActiveView, dark,
}: {
  activeView: "during" | "after";
  setActiveView: (v: "during" | "after") => void;
  dark?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
      {(["during", "after"] as const).map((view) => {
        const active = activeView === view;
        const activeGrad = view === "during" ? TGL_DURING : TGL_AFTER;
        return (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            style={{
              fontFamily: BODY, fontSize: 12, fontWeight: 600, letterSpacing: "0.05em",
              padding: "7px 18px", borderRadius: 100,
              border: active
                ? "none"
                : dark ? "1px solid rgba(255,255,255,0.12)" : `1px solid ${C.border}`,
              background: active
                ? dark
                  ? (view === "during" ? "#C8F064" : "#2A9D6E")
                  : activeGrad
                : "transparent",
              color: active
                ? dark ? "#0A0A0A" : "#fff"
                : dark ? "rgba(255,255,255,0.45)" : C.secondary,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {view === "during" ? "During term" : "After term"}
          </button>
        );
      })}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
interface Props { data: DealData; printMode?: boolean; mode?: "minimal" | "wrapped"; }

export default function DealSummary({ data, printMode, mode = "minimal" }: Props) {
  const reduced = useReducedMotion();
  const [activeView, setActiveView] = useState<"during" | "after">("during");

  function fadeUp(delay = 0): MotionProps {
    if (reduced) return {};
    return { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.38, ease: "easeOut", delay } };
  }
  const inView: MotionProps = reduced ? {} : {
    initial: { opacity: 0 }, whileInView: { opacity: 1 },
    viewport: { once: true }, transition: { duration: 0.4 },
  };

  // ── Derived values ─────────────────────────────────────────────────────────
  const royalties  = data.royalties ?? [];
  const duringAvg  = avgPct(royalties, "during_term_pct");
  const afterAvg   = avgPct(royalties, "post_term_pct");
  const totalAdv   = (data.advance_initial_usd ?? 0) + (data.advance_rollover_usd ?? 0);
  const yrs        = data.term_years;

  // Title split — "Publisher — Artist"
  const titleParts    = (data.deal_title ?? "Untitled Deal").split(" — ");
  const publisherLine = titleParts[0];
  const artistName    = titleParts.length > 1 ? titleParts.slice(1).join(" — ") : null;

  // Quickstats
  const royMin = royalties.length ? Math.min(...royalties.map(r => r.during_term_pct)) : null;
  const royMax = royalties.length ? Math.max(...royalties.map(r => r.during_term_pct)) : null;
  const royRange = royMin !== null && royMax !== null
    ? royMin === royMax ? `${royMin}%` : `${royMin}–${royMax}%`
    : "—";

  // Timeline nodes — only include nodes with real content
  const rawTlNodes: Array<TLNode | null> = [
    { label: "Signing",           timeframe: data.date ?? "—",                         description: "Deal becomes effective. Rights transfer begins.",           color: TL_CONFIG[0].color, Icon: TL_CONFIG[0].Icon },
    data.advance_rollover_conditions ? { label: "Rollover Window", timeframe: "—", description: wLimit(data.advance_rollover_conditions, 25), color: TL_CONFIG[1].color, Icon: TL_CONFIG[1].Icon } : null,
    data.early_exit ? { label: "Early Exit", timeframe: "—", description: wLimit(data.early_exit, 25), color: TL_CONFIG[2].color, Icon: TL_CONFIG[2].Icon } : null,
    (data.renewal_terms || data.term_notes) ? { label: data.renewal_terms ? "Renewal Window" : "Royalties Improve", timeframe: yrs !== null ? `After year ${yrs}` : "—", description: wLimit(data.renewal_terms ?? data.term_notes, 25), color: TL_CONFIG[3].color, Icon: TL_CONFIG[3].Icon } : null,
    data.catalog_reversion ? { label: "Catalog Return", timeframe: "—", description: wLimit(data.catalog_reversion, 25), color: TL_CONFIG[4].color, Icon: TL_CONFIG[4].Icon } : null,
  ];
  const tlNodes: TLNode[] = rawTlNodes.filter((n): n is TLNode => n !== null);

  // KV rows — drop empties so cards don't show blank lines
  const scopeRows = [
    { label: "Existing catalog",      value: data.scope_existing        ? wLimit("All songs written before signing", 6)  : null },
    { label: "New compositions",      value: data.scope_new             ? wLimit("All songs written during the deal", 6) : null },
    { label: "Territory",             value: data.territory             ? (data.territory.toLowerCase().includes("world") ? "Worldwide" : wLimit(data.territory, 6)) : null },
    { label: "Unexploited reversion", value: data.unexploited_reversion ? wLimit("Returns one year after term ends", 6)  : null },
  ].filter(r => r.value && r.value !== "—");
  const accountingRows = [
    { label: "Statements",        value: data.accounting_frequency },
    { label: "Days after period", value: data.accounting_days !== null ? `${data.accounting_days} days` : null },
    { label: "Pipeline calc",     value: data.pipeline_calc_available === null ? null : data.pipeline_calc_available ? "Available" : "Not available" },
    { label: "Audit rights",      value: data.audit_rights ? wLimit(data.audit_rights, 6) : null },
  ].filter(r => r.value && r.value !== "—");

  // Section 05 answers
  const royaltyList = data.artist_share_pct !== null && data.artist_share_pct !== undefined
    ? `${data.artist_share_pct}% of net receipts.`
    : royalties.length
      ? royalties.map(r => `${cleanType(r.income_type)}: ${r.during_term_pct}%`).join(" · ")
      : "No royalty data parsed.";

  const advanceAnswer = wLimit([
    data.recoupment_structure
      ? `${usd(data.advance_initial_usd)} ${data.advance_initial_notes ? "— " + data.advance_initial_notes : "guaranteed spend on this deal."}`
      : `${usd(data.advance_initial_usd)} upfront at signing.`,
    data.advance_rollover_usd ? `Additional ${usd(data.advance_rollover_usd)} available if advances are recouped within the term.` : null,
  ].filter(Boolean).join(" "), 30);

  const returnAnswer = yrs !== null
    ? wLimit(
        data.renewal_terms
          ? `At the end of the ${yrs}-year license period, unless renewed.`
          : `No earlier than ${yrs} years from signing, once all advances are fully recouped.`,
        30,
      )
    : null;
  const exitAnswer   = data.early_exit ? wLimit(data.early_exit, 30) : null;

  const royaltyTrendAnswer = afterAvg > duringAvg
    ? `Yes — rises from ${duringAvg}% to ${afterAvg}% on average once the term ends.`
    : afterAvg < duringAvg
      ? "Rates vary by income type. See the royalty breakdown above."
      : null;

  const scopeParts = [
    data.scope_existing ? "Existing catalog: all songs written before signing." : null,
    data.scope_new      ? "New songs: everything written during the deal." : null,
  ].filter(Boolean);
  const scopeAnswer = scopeParts.length ? wLimit(scopeParts.join(" "), 30) : null;

  const paymentParts = [
    data.accounting_frequency ? `${data.accounting_frequency} statements` : null,
    data.accounting_days      ? `${data.accounting_days} days after each period` : null,
    data.pipeline_calc_available ? "Pipeline calculation available on request" : null,
    data.audit_rights ? wLimit(data.audit_rights, 8) : null,
  ].filter(Boolean);
  const paymentAnswer = paymentParts.length ? wLimit(paymentParts.join(". ") + ".", 30) : null;

  const summaryItems = [
    { cfgIndex: 0, question: "What % do I earn right now?",     answer: royalties.length ? royaltyList : null },
    { cfgIndex: 1, question: "How much money upfront?",         answer: data.advance_initial_usd ? advanceAnswer : null },
    { cfgIndex: 2, question: "When do I get my music back?",    answer: returnAnswer       },
    { cfgIndex: 3, question: "What does early exit cost?",      answer: exitAnswer         },
    { cfgIndex: 4, question: "Does my rate improve over time?", answer: royaltyTrendAnswer },
    { cfgIndex: 5, question: "Which songs are covered?",        answer: scopeAnswer        },
    { cfgIndex: 6, question: "How often do I get paid?",        answer: paymentAnswer      },
  ].filter((item): item is { cfgIndex: number; question: string; answer: string } => !!item.answer);

  // ── PRINT MODE ─────────────────────────────────────────────────────────────
  if (printMode) {
    return (
      <div style={{ background: "#fff", width: "297mm", minHeight: "210mm", padding: "32px 36px", fontFamily: BODY, color: C.text }}>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 4px" }}>
          {publisherLine}{artistName ? ` — ${artistName}` : ""}
        </h1>
        {data.date && <p style={{ fontFamily: BODY, fontSize: 12, color: C.secondary, margin: "0 0 24px" }}>{data.date}</p>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 32 }}>
          {[
            { label: "Term", value: yrs !== null ? `${yrs} yrs` : "—" },
            { label: "Total Advance", value: usd(totalAdv || null) },
            { label: "Royalty Range", value: royRange },
            { label: "Catalog Return", value: "After term" },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: C.cardBg, borderRadius: 8, padding: "12px 16px" }}>
              <p style={{ fontFamily: BODY, fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.secondary, margin: "0 0 4px" }}>{label}</p>
              <p style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>
        {summaryItems.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < summaryItems.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <p style={{ fontFamily: BODY, fontSize: 11, fontWeight: 600, color: C.text, margin: 0, minWidth: 180 }}>{item.question}</p>
            <p style={{ fontFamily: BODY, fontSize: 11, color: C.secondary, margin: 0, lineHeight: 1.5 }}>{item.answer}</p>
          </div>
        ))}
      </div>
    );
  }

  // ── MINIMAL MODE ───────────────────────────────────────────────────────────
  if (mode === "minimal") {
    return (
      <div style={{ background: C.pageBg, maxWidth: 680, margin: "0 auto", padding: "44px 32px 80px", fontFamily: BODY, color: C.text }}>

        {/* HERO */}
        <motion.div {...(reduced ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.4 } })}
          style={{ paddingBottom: 32, borderBottom: `1px solid ${C.border}`, marginBottom: 0 }}>
          <h1 style={{ fontFamily: DISPLAY, fontSize: 48, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 0.97, margin: "0 0 16px" }}>
            <span style={{ display: "block", color: C.text }}>{publisherLine} ×</span>
            {artistName && <span style={{ display: "block", color: C.trust }}>{artistName}</span>}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {data.date && (
              <span style={{ fontFamily: BODY, fontSize: 13, color: C.secondary }}>{data.date}</span>
            )}
            {data.status && (
              <span style={{ fontFamily: BODY, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", background: C.trust, color: "#EEF4F8", borderRadius: 100, padding: "4px 12px" }}>
                {data.status}
              </span>
            )}
          </div>
        </motion.div>

        {/* QUICKSTATS */}
        <motion.div {...fadeUp(0.05)} style={{ background: C.text, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", marginBottom: 48 }}>
          {[
            { label: yrs !== null && data.renewal_terms ? "License period" : "Minimum term", value: yrs !== null ? `${yrs} yrs` : "—",         sub: data.renewal_terms ? wLimit("Rolling renewal after term", 8) : wLimit("Full reversion takes longer — see timeline", 8) },
            { label: data.recoupment_structure ? "Funding" : "Total advance", value: usdK(totalAdv || null),                    sub: wLimit([usd(data.advance_initial_usd), data.advance_rollover_usd ? `+${usdK(data.advance_rollover_usd)} if recouped` : null].filter(Boolean).join(" · "), 8) },
            data.artist_share_pct !== null && data.artist_share_pct !== undefined
              ? { label: "Your share", value: `${data.artist_share_pct}%`, sub: "Of net receipts" }
              : { label: "Royalty range", value: royRange, sub: "During term" },
          ].map(({ label, value, sub }, i) => (
            <div key={i} style={{
              padding: "20px 20px",
              borderRight: i < 2 ? "1px solid rgba(255,255,255,0.08)" : "none",
            }}>
              <p style={{ fontFamily: BODY, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", margin: "0 0 8px" }}>
                {label}
              </p>
              <p style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 700, letterSpacing: "-0.01em", color: "#fff", margin: "0 0 4px" }}>
                {value}
              </p>
              {sub && sub !== "—" && (
                <p style={{ fontFamily: BODY, fontSize: 10, color: "rgba(255,255,255,0.25)", margin: 0 }}>
                  {sub}
                </p>
              )}
            </div>
          ))}
        </motion.div>

        {/* 01 — ROYALTY SPLIT */}
        <motion.div {...inView}>
          <SectionHeader num="01" title="Royalty Split" />
          {royalties.length > 0 ? (
            <>
              {afterAvg !== duringAvg && (
                <RoyaltyToggle activeView={activeView} setActiveView={setActiveView} />
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {royalties.map((row, i) => (
                  <RoyaltyBarMinimal
                    key={i}
                    label={cleanType(row.income_type)}
                    pctVal={activeView === "during" ? row.during_term_pct : row.post_term_pct}
                    pctRight={activeView === "during" ? row.during_term_pct : row.post_term_pct}
                    gradient={activeView === "during" ? BAR_DURING : BAR_AFTER}
                    index={i}
                    view={activeView}
                    reduced={reduced}
                  />
                ))}
              </div>
              {/* Legend — only when deltas exist (during vs after differ) */}
              {afterAvg !== duringAvg && (
                <div style={{ display: "flex", gap: 20, marginBottom: 28 }}>
                  {[{ label: "During term", grad: BAR_DURING }, { label: "After term", grad: BAR_AFTER }].map(({ label, grad }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 24, height: 10, borderRadius: 4, background: grad, flexShrink: 0 }} />
                      <span style={{ fontFamily: BODY, fontSize: 12, color: C.secondary }}>{label}</span>
                    </div>
                  ))}
                </div>
              )}
              {/* Table — collapse to single share column when during == after */}
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {(afterAvg !== duringAvg ? ["Source", "During Term", "After Term", "Change"] : ["Source", "Share"]).map((h, i) => (
                      <th key={h} style={{ fontFamily: BODY, padding: "6px 12px 10px", textAlign: i === 0 ? "left" : "right", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: C.secondary, fontWeight: 600 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {royalties.map((row, i) => {
                    const delta = row.post_term_pct - row.during_term_pct;
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : C.cardBg, borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ fontFamily: BODY, padding: "11px 12px", color: C.text, fontWeight: 500, fontSize: 14 }}>{cleanType(row.income_type)}</td>
                        {afterAvg !== duringAvg ? (
                          <>
                            <td style={{ fontFamily: BODY, padding: "11px 12px", textAlign: "right", color: C.muted, fontSize: 14 }}>{pct(row.during_term_pct)}</td>
                            <td style={{ fontFamily: DISPLAY, padding: "11px 12px", textAlign: "right", color: C.green, fontWeight: 700, fontSize: 16 }}>{pct(row.post_term_pct)}</td>
                            <td style={{ padding: "11px 12px", textAlign: "right" }}>
                              {delta > 0
                                ? <span style={{ fontFamily: BODY, display: "inline-block", background: "#D4EBE0", color: C.green, fontSize: 11, fontWeight: 600, borderRadius: 100, padding: "2px 9px" }}>▲ +{delta}%</span>
                                : delta < 0
                                ? <span style={{ fontFamily: BODY, display: "inline-block", background: C.cardBg, color: C.secondary, fontSize: 11, fontWeight: 600, borderRadius: 100, padding: "2px 9px" }}>▼ {delta}%</span>
                                : <span style={{ color: C.secondary, fontFamily: BODY }}>—</span>}
                            </td>
                          </>
                        ) : (
                          <td style={{ fontFamily: DISPLAY, padding: "11px 12px", textAlign: "right", color: C.green, fontWeight: 700, fontSize: 16 }}>{pct(row.during_term_pct)}</td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          ) : (
            <p style={{ fontFamily: BODY, fontSize: 13, color: C.secondary }}>Royalties not parsed — review contract</p>
          )}
        </motion.div>

        <Divider />

        {/* 02 — DEAL TIMELINE */}
        <motion.div {...inView}>
          <SectionHeader num="02" title="Deal Timeline" />
          <div style={{ paddingLeft: 4 }}>
            <VerticalTimeline nodes={tlNodes} reduced={reduced} />
          </div>
        </motion.div>

        <Divider />

        {/* 03 — ADVANCES & RECOUPMENT */}
        <motion.div {...inView}>
          <SectionHeader num="03" title="Advances & Recoupment" />
          <div style={{ display: "grid", gridTemplateColumns: data.advance_rollover_usd ? "1fr 1fr" : "1fr", gap: 12, marginBottom: 12 }}>
            <div style={{ background: C.cardBg, borderRadius: 12, padding: "20px 24px" }}>
              <HandCoins size={24} weight="duotone" color={C.secondary} />
              <p style={{ fontFamily: BODY, fontSize: 10, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: C.secondary, margin: "10px 0 6px" }}>Initial Advance</p>
              <p style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 700, letterSpacing: "-0.01em", color: C.green, margin: 0 }}>{usd(data.advance_initial_usd)}</p>
              {data.advance_initial_notes && (
                <p style={{ fontFamily: BODY, fontSize: 11, color: C.secondary, margin: "6px 0 0", lineHeight: 1.5 }}>
                  {wLimit(data.advance_initial_notes, 15)}
                </p>
              )}
            </div>
            {data.advance_rollover_usd ? (
              <div style={{ background: "linear-gradient(135deg,#D4EBE0,#E8F5EE)", borderRadius: 12, padding: "20px 24px" }}>
                <ArrowFatLinesUp size={24} weight="duotone" color={C.green} />
                <p style={{ fontFamily: BODY, fontSize: 10, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: C.green, margin: "10px 0 6px" }}>Rollover Advance</p>
                <p style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 700, letterSpacing: "-0.01em", color: C.green, margin: 0 }}>{usd(data.advance_rollover_usd)}</p>
                {data.advance_rollover_conditions && (
                  <p style={{ fontFamily: BODY, fontSize: 11, color: C.secondary, margin: "6px 0 0", lineHeight: 1.5 }}>
                    {wLimit(data.advance_rollover_conditions, 15)}
                  </p>
                )}
              </div>
            ) : null}
          </div>
          <div style={{ background: C.cardBg, borderRadius: 10, padding: "16px 20px", marginBottom: 12 }}>
            <p style={{ fontFamily: BODY, fontSize: 10, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: C.muted, margin: "0 0 8px" }}>How recoupment works</p>
            <p style={{ fontFamily: BODY, fontSize: 12, color: C.secondary, margin: 0, lineHeight: 1.7 }}>
              {wLimit(data.recoupment_structure ?? "Advances are recouped from your earned royalties over time. Once fully recouped, royalties flow to you directly.", 30)}
            </p>
          </div>
          {data.recoupment_rate !== null && (
            <div style={{ background: C.pageBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
              <p style={{ fontFamily: BODY, fontSize: 10, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: C.muted, margin: 0, flexShrink: 0, paddingTop: 2 }}>
                Early exit option
              </p>
              <p style={{ fontFamily: BODY, fontSize: 12, color: C.caution, margin: 0, lineHeight: 1.6, textAlign: "right" }}>
                {wLimit(`After year ${yrs ?? "?"}, you may exit by repaying ${data.recoupment_rate}% of any remaining balance.`, 25)}
              </p>
            </div>
          )}
        </motion.div>

        {(scopeRows.length > 0 || accountingRows.length > 0) && (
          <>
            <Divider />

            {/* 04 — SCOPE & ACCOUNTING */}
            <motion.div {...inView}>
              <SectionHeader num="04" title={scopeRows.length && accountingRows.length ? "Scope & Accounting" : scopeRows.length ? "Scope" : "Accounting"} />
              <div style={{ display: "grid", gridTemplateColumns: scopeRows.length && accountingRows.length ? "1fr 1fr" : "1fr", gap: 12 }}>
                {scopeRows.length > 0 && (
                  <div style={{ background: C.cardBg, borderRadius: 12, padding: "20px 24px 12px" }}>
                    <MusicNote size={20} weight="duotone" color={C.secondary} />
                    <p style={{ fontFamily: BODY, fontSize: 10, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: C.secondary, margin: "10px 0 16px" }}>Scope of Rights</p>
                    {scopeRows.map(({ label, value }) => <KVRow key={label} label={label} value={value} />)}
                  </div>
                )}
                {accountingRows.length > 0 && (
                  <div style={{ background: C.cardBg, borderRadius: 12, padding: "20px 24px 12px" }}>
                    <Receipt size={20} weight="duotone" color={C.secondary} />
                    <p style={{ fontFamily: BODY, fontSize: 10, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: C.secondary, margin: "10px 0 16px" }}>Accounting & Audit</p>
                    {accountingRows.map(({ label, value }) => <KVRow key={label} label={label} value={value} />)}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}

        <Divider />

        {/* 05 — PLAIN ENGLISH SUMMARY */}
        <motion.div {...inView}>
          <SectionHeader num="05" title="Plain English Summary" />
          <p style={{ fontFamily: BODY, fontSize: 12, color: C.muted, margin: "-12px 0 4px", lineHeight: 1.5 }}>
            The things that matter most, in order of importance
          </p>
          <div>
            {summaryItems.map((item, i) => (
              <SummaryItem key={i} {...item} isLast={i === summaryItems.length - 1} />
            ))}
          </div>
        </motion.div>

        {data.additional_notes && (
          <>
            <Divider />
            <motion.div {...inView}>
              <p style={{ fontFamily: BODY, fontSize: 10, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: C.secondary, margin: "0 0 12px" }}>Additional Notes</p>
              <p style={{ fontFamily: BODY, fontSize: 14, color: C.secondary, lineHeight: 1.7, margin: 0 }}>{data.additional_notes}</p>
            </motion.div>
          </>
        )}
      </div>
    );
  }

  // ── WRAPPED MODE ───────────────────────────────────────────────────────────
  return (
    <div style={{ background: "#0A0A0A", maxWidth: 480, margin: "0 auto", fontFamily: BODY, color: "#F7F5F0" }}>

      {/* PANEL 1 — HERO */}
      <div style={{ background: "#0A0A0A", padding: "48px 32px 40px", position: "relative", overflow: "hidden" }}>
        {/* Glow */}
        <div style={{
          position: "absolute", bottom: 0, right: 0,
          width: 320, height: 320, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(200,240,100,0.09) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <motion.div {...(reduced ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } })}>
          <h1 style={{ fontFamily: DISPLAY, fontSize: 44, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 0.95, margin: "0 0 20px" }}>
            <span style={{ display: "block", color: "#fff" }}>Good Problem</span>
            <span style={{ display: "block", color: "#fff" }}>Studios ×</span>
            {artistName && <span style={{ display: "block", color: "#C8F064" }}>{artistName}</span>}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {data.date && <span style={{ fontFamily: BODY, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{data.date}</span>}
            {data.status && (
              <span style={{ fontFamily: BODY, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", background: C.trust, color: "#EEF4F8", borderRadius: 100, padding: "4px 12px" }}>
                {data.status}
              </span>
            )}
          </div>
        </motion.div>
      </div>

      {/* QUICKSTATS */}
      <div style={{ background: "#111111", display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
        {[
          { label: data.renewal_terms ? "License period" : "Minimum term", value: yrs !== null ? `${yrs} yrs` : "—", sub: data.renewal_terms ? "Rolling renewal after" : wLimit("Full reversion takes longer", 6) },
          { label: data.recoupment_structure ? "Funding" : "Total advance", value: usdK(totalAdv || null), sub: data.advance_rollover_usd ? "signing + rollover" : "on signing" },
          data.artist_share_pct !== null && data.artist_share_pct !== undefined
            ? { label: "Your share", value: `${data.artist_share_pct}%`, sub: "Of net receipts" }
            : { label: "Royalty range", value: royRange, sub: afterAvg !== duringAvg ? "During term" : "Of net receipts" },
        ].map(({ label, value, sub }, i) => (
          <div key={i} style={{ padding: "20px 16px", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
            <p style={{ fontFamily: BODY, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", margin: "0 0 8px" }}>
              {label}
            </p>
            <p style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 700, letterSpacing: "-0.01em", color: "#C8F064", margin: "0 0 4px" }}>
              {value}
            </p>
            <p style={{ fontFamily: BODY, fontSize: 10, color: "rgba(255,255,255,0.25)", margin: 0 }}>
              {sub}
            </p>
          </div>
        ))}
      </div>

      {/* PANEL 2 — THE ADVANCE / FUNDING */}
      {data.advance_initial_usd ? (
      <div style={{ background: "#C8F064", padding: "40px 32px" }}>
        <p style={{ fontFamily: BODY, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(0,0,0,0.4)", margin: "0 0 8px" }}>
          {data.recoupment_structure ? "Funding" : "The Advance"}
        </p>
        <p style={{ fontFamily: BODY, fontSize: 15, fontWeight: 500, color: "#0A0A0A", margin: "0 0 8px" }}>
          {data.recoupment_structure ? "Guaranteed spend on this deal." : "On signing, this is yours."}
        </p>
        <p style={{ fontFamily: DISPLAY, fontSize: 80, fontWeight: 700, letterSpacing: "-0.02em", color: "#0A0A0A", margin: "0 0 4px", lineHeight: 1 }}>
          {usdK(data.advance_initial_usd)}
        </p>
        {data.advance_initial_notes && (
          <p style={{ fontFamily: BODY, fontSize: 12, color: "rgba(0,0,0,0.45)", margin: "0 0 20px" }}>
            {wLimit(data.advance_initial_notes, 15)}
          </p>
        )}
        {data.advance_rollover_usd && (
          <div style={{ background: "rgba(0,0,0,0.08)", borderRadius: 10, padding: "16px 20px" }}>
            <p style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 700, letterSpacing: "-0.01em", color: "#0A0A0A", margin: "0 0 4px" }}>
              + {usdK(data.advance_rollover_usd)}
            </p>
            {data.advance_rollover_conditions && (
              <p style={{ fontFamily: BODY, fontSize: 11, color: "rgba(0,0,0,0.45)", margin: 0 }}>
                {wLimit(data.advance_rollover_conditions, 15)}
              </p>
            )}
          </div>
        )}
      </div>
      ) : null}

      {/* PANEL 3 — YOUR CUT */}
      <div style={{ background: "#1A1814", padding: "40px 32px" }}>
        <p style={{ fontFamily: BODY, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", margin: "0 0 8px" }}>
          Your Cut
        </p>
        <p style={{ fontFamily: BODY, fontSize: 15, fontWeight: 500, color: "rgba(255,255,255,0.7)", margin: "0 0 24px" }}>
          Every dollar collected. Here's the split.
        </p>
        {afterAvg !== duringAvg && (
          <RoyaltyToggle activeView={activeView} setActiveView={setActiveView} dark />
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {royalties.map((row, i) => {
            const pctVal = activeView === "during" ? row.during_term_pct : row.post_term_pct;
            return (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontFamily: BODY, fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                    {cleanType(row.income_type)}
                  </span>
                  <span style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 700, color: "#C8F064" }}>
                    {pctVal}%
                  </span>
                </div>
                <div style={{ height: 8, borderRadius: 100, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <motion.div
                    key={`wrapped-${activeView}-${i}`}
                    initial={{ width: reduced ? `${pctVal}%` : "0%" }}
                    animate={{ width: `${pctVal}%` }}
                    transition={reduced ? { duration: 0 } : { duration: 0.5, ease: "easeOut", delay: i * 0.08 }}
                    style={{
                      height: "100%", borderRadius: 100,
                      background: activeView === "during" ? "#C8F064" : "#2A9D6E",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PANEL 4 — HOW IT UNFOLDS */}
      <div style={{ background: "#0F2318", padding: "40px 32px" }}>
        <p style={{ fontFamily: BODY, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", margin: "0 0 8px" }}>
          How It Unfolds
        </p>
        <p style={{ fontFamily: BODY, fontSize: 15, fontWeight: 500, color: "rgba(255,255,255,0.7)", margin: "0 0 32px" }}>
          A clear map of where this deal goes.
        </p>
        <VerticalTimeline nodes={tlNodes} reduced={reduced} dark />
      </div>

      {/* PANEL 5 — THE TERM */}
      {yrs !== null && (
        <div style={{ background: "#1A0F28", padding: "40px 32px" }}>
          <p style={{ fontFamily: BODY, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", margin: "0 0 8px" }}>
            {data.renewal_terms ? "License Period" : "The Term"}
          </p>
          <p style={{ fontFamily: BODY, fontSize: 15, fontWeight: 500, color: "rgba(255,255,255,0.7)", margin: "0 0 12px" }}>
            {data.renewal_terms ? "How long this deal runs." : "Minimum time your music is administered."}
          </p>
          <p style={{ fontFamily: DISPLAY, fontSize: 88, fontWeight: 700, letterSpacing: "-0.02em", color: "#fff", margin: 0, lineHeight: 1 }}>
            {yrs}
          </p>
          <p style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", color: "rgba(255,255,255,0.25)", margin: "0 0 28px" }}>
            {data.renewal_terms ? "year license" : "years minimum"}
          </p>
          {(data.renewal_terms || data.term_notes) && (
            <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "16px 20px" }}>
              <p style={{ fontFamily: BODY, fontSize: 12, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.7 }}>
                {wLimit(data.renewal_terms ?? data.term_notes, 40)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* PANEL 6 — PLAIN ENGLISH */}
      <div style={{ background: "#F7F5F0", padding: "40px 32px" }}>
        <p style={{ fontFamily: BODY, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted, margin: "0 0 8px" }}>
          Plain English
        </p>
        <p style={{ fontFamily: BODY, fontSize: 15, fontWeight: 500, color: C.text, margin: "0 0 4px" }}>
          The things that matter most.
        </p>
        <div>
          {summaryItems.map((item, i) => (
            <SummaryItem key={i} {...item} isLast={i === summaryItems.length - 1} />
          ))}
        </div>
      </div>

    </div>
  );
}
