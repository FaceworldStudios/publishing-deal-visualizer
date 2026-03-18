import React from "react";
import {
  Document, Page, View, Text, StyleSheet,
} from "@react-pdf/renderer";
import { DealData } from "@/lib/types";

// ── Helpers ───────────────────────────────────────────────────────────────────
function usd(val: number | null | undefined): string {
  if (val == null || val === 0) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
}

function usdK(val: number | null | undefined): string {
  if (val == null || val === 0) return "—";
  if (val >= 1000) return `$${Math.round(val / 1000)}k`;
  return usd(val);
}

function pct(val: number | null | undefined): string {
  if (val == null) return "—";
  return `${val}%`;
}

function cleanType(s: string): string {
  return s.replace(/\bincome\b/gi, "").replace(/\s{2,}/g, " ").trim();
}

function wLimit(s: string | null | undefined, n: number): string {
  if (!s || s.trim() === "" || s === "—") return "—";
  return s.trim().split(/\s+/).slice(0, n).join(" ");
}

// ── Styles ────────────────────────────────────────────────────────────────────
const C = {
  text:    "#1A1814",
  muted:   "#7A7570",
  faint:   "#A8A4A0",
  border:  "#E0DDD8",
  cardBg:  "#F2F0EB",
  green:   "#1A6B4A",
  trust:   "#1B4F6B",
  white:   "#FFFFFF",
};

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.text,
    backgroundColor: C.white,
    padding: 40,
  },

  // Header
  header: { marginBottom: 20 },
  headerTitle: { fontSize: 20, fontFamily: "Helvetica-Bold", color: C.text, marginBottom: 4 },
  headerArtist: { color: C.trust },
  headerMeta: { fontSize: 8, color: C.muted, marginBottom: 2 },
  headerPrepared: { fontSize: 7, color: C.faint },

  divider: { borderBottomWidth: 1, borderBottomColor: C.border, marginVertical: 14 },

  // Key numbers
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 0 },
  statBox: { flex: 1, backgroundColor: C.cardBg, padding: 10, borderRadius: 4 },
  statLabel: { fontSize: 7, color: C.muted, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  statValue: { fontSize: 15, fontFamily: "Helvetica-Bold", color: C.text },
  statSub: { fontSize: 7, color: C.faint, marginTop: 2 },

  // Section
  sectionNum: { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.trust, letterSpacing: 1, marginBottom: 2 },
  sectionTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.text, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },

  // Table
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 5, marginBottom: 4 },
  tableRow: { flexDirection: "row", paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: C.border },
  tableRowAlt: { flexDirection: "row", paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.cardBg },
  colSource: { flex: 3, fontSize: 8, color: C.text },
  colSourceHd: { flex: 3, fontSize: 7, fontFamily: "Helvetica-Bold", color: C.muted, textTransform: "uppercase" },
  colNum: { flex: 1.5, fontSize: 8, color: C.muted, textAlign: "right" },
  colNumHd: { flex: 1.5, fontSize: 7, fontFamily: "Helvetica-Bold", color: C.muted, textTransform: "uppercase", textAlign: "right" },
  colGreen: { flex: 1.5, fontSize: 8, fontFamily: "Helvetica-Bold", color: C.green, textAlign: "right" },
  colDelta: { flex: 1.5, fontSize: 7, color: C.green, textAlign: "right" },

  // Timeline
  tlRow: { flexDirection: "row", marginBottom: 10, gap: 10 },
  tlTime: { width: 60, fontSize: 7, color: C.faint, textAlign: "right", paddingTop: 1 },
  tlDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.trust, marginTop: 1 },
  tlContent: { flex: 1 },
  tlName: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.text, marginBottom: 2 },
  tlDesc: { fontSize: 8, color: C.muted, lineHeight: 1.4 },

  // Advances
  advRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  advCard: { flex: 1, backgroundColor: C.cardBg, padding: 10, borderRadius: 4 },
  advCardGreen: { flex: 1, backgroundColor: "#D4EBE0", padding: 10, borderRadius: 4 },
  advLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  advAmount: { fontSize: 16, fontFamily: "Helvetica-Bold", color: C.green, marginBottom: 3 },
  advNote: { fontSize: 7, color: C.muted, lineHeight: 1.4 },
  recoupBox: { backgroundColor: C.cardBg, padding: 10, borderRadius: 4, marginBottom: 6 },
  recoupLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.faint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 },
  recoupText: { fontSize: 8, color: C.muted, lineHeight: 1.5 },

  // KV
  kvCols: { flexDirection: "row", gap: 8 },
  kvCard: { flex: 1, backgroundColor: C.cardBg, padding: 10, borderRadius: 4 },
  kvCardLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  kvRow: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 4 },
  kvKey: { fontSize: 8, color: C.faint },
  kvVal: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.text, textAlign: "right", flex: 1, marginLeft: 8 },

  // Summary
  summaryRow: { flexDirection: "row", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  summaryDot: { width: 8, height: 8, borderRadius: 4, marginTop: 1 },
  summaryContent: { flex: 1 },
  summaryQ: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.text, marginBottom: 2 },
  summaryA: { fontSize: 8, color: C.muted, lineHeight: 1.45 },
  summaryBadge: { fontSize: 7, color: C.green },
});

// ── Timeline dot color per milestone ─────────────────────────────────────────
const TL_COLORS = ["#1B4F6B", "#1A6B4A", "#6B6560", "#B05C1A", "#A8A4A0"];

// ── Summary dot color per item ────────────────────────────────────────────────
const SUMMARY_COLORS = ["#1B4F6B", "#1A6B4A", "#1A6B4A", "#6B6560", "#1A6B4A", "#6B6560", "#6B6560"];
const SUMMARY_BADGES = ["Critical", "Critical", "Critical", "High", "High", "Supporting", "Context"];

// ── Component ─────────────────────────────────────────────────────────────────
export default function DealSummaryPDF({ data }: { data: DealData }) {
  const royalties = data.royalties ?? [];
  const yrs = data.term_years;
  const totalAdv = (data.advance_initial_usd ?? 0) + (data.advance_rollover_usd ?? 0);

  const titleParts = (data.deal_title ?? "Untitled Deal").split(" — ");
  const publisherLine = titleParts[0];
  const artistName = titleParts.length > 1 ? titleParts.slice(1).join(" — ") : null;

  const royMin = royalties.length ? Math.min(...royalties.map(r => r.during_term_pct)) : null;
  const royMax = royalties.length ? Math.max(...royalties.map(r => r.during_term_pct)) : null;
  const royRange = royMin !== null && royMax !== null
    ? royMin === royMax ? `${royMin}%` : `${royMin}–${royMax}%`
    : "—";

  // Timeline
  const tlNodes = [
    { label: "Signing",           timeframe: data.date ?? "—",                          desc: "Deal becomes effective. Rights transfer begins.",  color: TL_COLORS[0] },
    { label: "Rollover Window",   timeframe: "—",                                       desc: wLimit(data.advance_rollover_conditions, 25),       color: TL_COLORS[1] },
    { label: "Early Exit",        timeframe: "—",                                       desc: wLimit(data.early_exit, 25),                        color: TL_COLORS[2] },
    { label: "Royalties Improve", timeframe: yrs != null ? `After year ${yrs}` : "—",  desc: wLimit(data.term_notes, 25),                        color: TL_COLORS[3] },
    { label: "Catalog Return",    timeframe: "—",                                       desc: wLimit(data.catalog_reversion, 25),                 color: TL_COLORS[4] },
  ];

  // Scope & accounting KV
  const scopeRows = [
    { k: "Existing catalog",      v: data.scope_existing        ? "All songs before signing"        : "—" },
    { k: "New compositions",      v: data.scope_new             ? "All songs during deal"           : "—" },
    { k: "Territory",             v: data.territory             ? (data.territory.toLowerCase().includes("world") ? "Worldwide" : wLimit(data.territory, 4)) : "—" },
    { k: "Unexploited reversion", v: data.unexploited_reversion ? "Returns one year after term"     : "—" },
  ];
  const acctRows = [
    { k: "Statements",        v: data.accounting_frequency ?? "—" },
    { k: "Days after period", v: data.accounting_days != null ? `${data.accounting_days} days` : "—" },
    { k: "Pipeline calc",     v: data.pipeline_calc_available == null ? "—" : data.pipeline_calc_available ? "Available" : "Not available" },
    { k: "Audit rights",      v: wLimit(data.audit_rights, 5) },
  ];

  // Plain English answers
  const duringAvg = royalties.length ? Math.round(royalties.reduce((s, r) => s + r.during_term_pct, 0) / royalties.length) : 0;
  const afterAvg  = royalties.length ? Math.round(royalties.reduce((s, r) => s + r.post_term_pct, 0)  / royalties.length) : 0;

  const royaltyList = royalties.length
    ? royalties.map(r => `${cleanType(r.income_type)}: ${r.during_term_pct}%`).join("  ·  ")
    : "No royalty data parsed.";

  const advanceAnswer = wLimit([
    `${usd(data.advance_initial_usd)} upfront at signing.`,
    data.advance_rollover_usd ? `Additional ${usd(data.advance_rollover_usd)} available if advances recouped within term.` : null,
  ].filter(Boolean).join(" "), 30);

  const returnAnswer  = wLimit(`No earlier than ${yrs ?? "?"} years from signing, once all advances are fully recouped.`, 30);
  const exitAnswer    = wLimit(data.early_exit ?? "No early exit terms specified in this deal.", 30);
  const trendAnswer   = afterAvg > duringAvg
    ? `Yes — rises from ${duringAvg}% to ${afterAvg}% on average once the term ends.`
    : "Royalty rate stays the same before and after the term.";
  const scopeAnswer   = wLimit([
    data.scope_existing ? "Existing catalog: all songs written before signing." : null,
    data.scope_new      ? "New songs: everything written during the deal." : null,
  ].filter(Boolean).join(" ") || "Scope not specified.", 30);
  const payParts = [
    data.accounting_frequency ? `${data.accounting_frequency} statements` : null,
    data.accounting_days      ? `${data.accounting_days} days after each period` : null,
  ].filter(Boolean);
  const payAnswer = wLimit(payParts.length ? payParts.join(". ") + "." : "Accounting terms not specified.", 30);

  const summaryItems = [
    { q: "What % do I earn right now?",     a: royaltyList   },
    { q: "How much money upfront?",         a: advanceAnswer },
    { q: "When do I get my music back?",    a: returnAnswer  },
    { q: "What does early exit cost?",      a: exitAnswer    },
    { q: "Does my rate improve over time?", a: trendAnswer   },
    { q: "Which songs are covered?",        a: scopeAnswer   },
    { q: "How often do I get paid?",        a: payAnswer     },
  ];

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <Text style={s.headerTitle}>
            {publisherLine} ×{artistName ? ` ${artistName}` : ""}
          </Text>
          <Text style={s.headerMeta}>
            {data.date ?? ""}{"  "}
            {data.status ? `· ${data.status}` : ""}
          </Text>
          <Text style={s.headerPrepared}>Prepared by Good Problem Studios</Text>
        </View>

        <View style={s.divider} />

        {/* ── KEY NUMBERS ── */}
        <View style={s.statsRow}>
          {[
            { label: "Minimum Term",   value: yrs != null ? `${yrs} yrs` : "—",  sub: "Minimum administration period" },
            { label: "Total Advance",  value: usdK(totalAdv || null),             sub: usd(data.advance_initial_usd) + (data.advance_rollover_usd ? ` + ${usd(data.advance_rollover_usd)}` : "") },
            { label: "Royalty Range",  value: royRange,                           sub: "During term" },
            { label: "Catalog Return", value: "After term",                       sub: yrs != null ? `${yrs}+ yrs post-term` : "Post-term" },
          ].map(({ label, value, sub }) => (
            <View key={label} style={s.statBox}>
              <Text style={s.statLabel}>{label}</Text>
              <Text style={s.statValue}>{value}</Text>
              <Text style={s.statSub}>{sub}</Text>
            </View>
          ))}
        </View>

        <View style={s.divider} />

        {/* ── ROYALTY BREAKDOWN ── */}
        <Text style={s.sectionNum}>01</Text>
        <Text style={s.sectionTitle}>Royalty Split</Text>
        {royalties.length > 0 ? (
          <View>
            <View style={s.tableHeader}>
              <Text style={s.colSourceHd}>Source</Text>
              <Text style={s.colNumHd}>During Term</Text>
              <Text style={s.colNumHd}>After Term</Text>
              <Text style={s.colNumHd}>Change</Text>
            </View>
            {royalties.map((row, i) => {
              const delta = row.post_term_pct - row.during_term_pct;
              return (
                <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                  <Text style={s.colSource}>{cleanType(row.income_type)}</Text>
                  <Text style={s.colNum}>{pct(row.during_term_pct)}</Text>
                  <Text style={s.colGreen}>{pct(row.post_term_pct)}</Text>
                  <Text style={s.colDelta}>{delta > 0 ? `▲ +${delta}%` : delta < 0 ? `▼ ${delta}%` : "—"}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={{ fontSize: 8, color: C.muted }}>Royalties not parsed — review contract</Text>
        )}

        <View style={s.divider} />

        {/* ── DEAL TIMELINE ── */}
        <Text style={s.sectionNum}>02</Text>
        <Text style={s.sectionTitle}>Deal Timeline</Text>
        {tlNodes.map((node, i) => (
          <View key={i} style={s.tlRow}>
            <Text style={s.tlTime}>{node.timeframe}</Text>
            <View style={[s.tlDot, { backgroundColor: node.color }]} />
            <View style={s.tlContent}>
              <Text style={s.tlName}>{node.label}</Text>
              <Text style={s.tlDesc}>{node.desc}</Text>
            </View>
          </View>
        ))}

        <View style={s.divider} />

        {/* ── ADVANCES ── */}
        <Text style={s.sectionNum}>03</Text>
        <Text style={s.sectionTitle}>Advances & Recoupment</Text>
        <View style={s.advRow}>
          <View style={s.advCard}>
            <Text style={s.advLabel}>Initial Advance</Text>
            <Text style={s.advAmount}>{usd(data.advance_initial_usd)}</Text>
            {data.advance_initial_notes && (
              <Text style={s.advNote}>{wLimit(data.advance_initial_notes, 15)}</Text>
            )}
          </View>
          <View style={s.advCardGreen}>
            <Text style={s.advLabel}>Rollover Advance</Text>
            <Text style={s.advAmount}>{usd(data.advance_rollover_usd ?? null)}</Text>
            {data.advance_rollover_conditions && (
              <Text style={s.advNote}>{wLimit(data.advance_rollover_conditions, 15)}</Text>
            )}
          </View>
        </View>
        <View style={s.recoupBox}>
          <Text style={s.recoupLabel}>How recoupment works</Text>
          <Text style={s.recoupText}>
            Advances are recouped from your earned royalties over time. Once fully recouped, royalties flow to you directly.
          </Text>
        </View>

        <View style={s.divider} />

        {/* ── SCOPE & ACCOUNTING ── */}
        <Text style={s.sectionNum}>04</Text>
        <Text style={s.sectionTitle}>Scope & Accounting</Text>
        <View style={s.kvCols}>
          <View style={s.kvCard}>
            <Text style={s.kvCardLabel}>Scope of Rights</Text>
            {scopeRows.map(({ k, v }) => (
              <View key={k} style={s.kvRow}>
                <Text style={s.kvKey}>{k}</Text>
                <Text style={s.kvVal}>{v}</Text>
              </View>
            ))}
          </View>
          <View style={s.kvCard}>
            <Text style={s.kvCardLabel}>Accounting & Audit</Text>
            {acctRows.map(({ k, v }) => (
              <View key={k} style={s.kvRow}>
                <Text style={s.kvKey}>{k}</Text>
                <Text style={s.kvVal}>{v}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.divider} />

        {/* ── PLAIN ENGLISH ── */}
        <Text style={s.sectionNum}>05</Text>
        <Text style={s.sectionTitle}>Plain English Summary</Text>
        {summaryItems.map((item, i) => (
          <View key={i} style={s.summaryRow}>
            <View style={[s.summaryDot, { backgroundColor: SUMMARY_COLORS[i] }]} />
            <View style={s.summaryContent}>
              <Text style={s.summaryQ}>
                {item.q}{"  "}
                <Text style={s.summaryBadge}>{SUMMARY_BADGES[i]}</Text>
              </Text>
              <Text style={s.summaryA}>{item.a}</Text>
            </View>
          </View>
        ))}

      </Page>
    </Document>
  );
}
