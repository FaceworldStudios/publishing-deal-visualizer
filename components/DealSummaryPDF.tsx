import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
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

// ── Derived data builder ──────────────────────────────────────────────────────
function buildDerived(data: DealData) {
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
  const duringAvg = royalties.length ? Math.round(royalties.reduce((s, r) => s + r.during_term_pct, 0) / royalties.length) : 0;
  const afterAvg  = royalties.length ? Math.round(royalties.reduce((s, r) => s + r.post_term_pct,  0) / royalties.length) : 0;

  const tlNodes = [
    { label: "Signing",           timeframe: data.date ?? "—",                         desc: "Deal becomes effective. Rights transfer begins.",  color: "#1B4F6B" },
    { label: "Rollover Window",   timeframe: "—",                                      desc: wLimit(data.advance_rollover_conditions, 25),       color: "#1A6B4A" },
    { label: "Early Exit",        timeframe: "—",                                      desc: wLimit(data.early_exit, 25),                        color: "#6B6560" },
    { label: "Royalties Improve", timeframe: yrs != null ? `After year ${yrs}` : "—", desc: wLimit(data.term_notes, 25),                        color: "#B05C1A" },
    { label: "Catalog Return",    timeframe: "—",                                      desc: wLimit(data.catalog_reversion, 25),                 color: "#A8A4A0" },
  ];
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

  const royaltyList = royalties.length
    ? royalties.map(r => `${cleanType(r.income_type)}: ${r.during_term_pct}%`).join("  ·  ")
    : "No royalty data parsed.";
  const advanceAnswer = wLimit([
    `${usd(data.advance_initial_usd)} upfront at signing.`,
    data.advance_rollover_usd ? `Additional ${usd(data.advance_rollover_usd)} available if advances recouped within term.` : null,
  ].filter(Boolean).join(" "), 30);
  const returnAnswer = wLimit(`No earlier than ${yrs ?? "?"} years from signing, once all advances are fully recouped.`, 30);
  const exitAnswer   = wLimit(data.early_exit ?? "No early exit terms specified in this deal.", 30);
  const trendAnswer  = afterAvg > duringAvg
    ? `Yes — rises from ${duringAvg}% to ${afterAvg}% on average once the term ends.`
    : "Royalty rate stays the same before and after the term.";
  const scopeAnswer  = wLimit([
    data.scope_existing ? "Existing catalog: all songs written before signing." : null,
    data.scope_new      ? "New songs: everything written during the deal." : null,
  ].filter(Boolean).join(" ") || "Scope not specified.", 30);
  const payParts = [
    data.accounting_frequency ? `${data.accounting_frequency} statements` : null,
    data.accounting_days      ? `${data.accounting_days} days after each period` : null,
  ].filter(Boolean);
  const payAnswer = wLimit(payParts.length ? payParts.join(". ") + "." : "Accounting terms not specified.", 30);

  const summaryItems = [
    { q: "What % do I earn right now?",     a: royaltyList,   badge: "Critical",   color: "#1B4F6B" },
    { q: "How much money upfront?",         a: advanceAnswer, badge: "Critical",   color: "#1A6B4A" },
    { q: "When do I get my music back?",    a: returnAnswer,  badge: "Critical",   color: "#1A6B4A" },
    { q: "What does early exit cost?",      a: exitAnswer,    badge: "High",       color: "#6B6560" },
    { q: "Does my rate improve over time?", a: trendAnswer,   badge: "High",       color: "#1A6B4A" },
    { q: "Which songs are covered?",        a: scopeAnswer,   badge: "Supporting", color: "#6B6560" },
    { q: "How often do I get paid?",        a: payAnswer,     badge: "Context",    color: "#6B6560" },
  ];

  return { royalties, yrs, totalAdv, publisherLine, artistName, royRange, duringAvg, afterAvg, tlNodes, scopeRows, acctRows, summaryItems };
}

// ══════════════════════════════════════════════════════════════════════════════
// MINIMAL PDF
// ══════════════════════════════════════════════════════════════════════════════
const m = StyleSheet.create({
  page:        { fontFamily: "Helvetica", fontSize: 9, color: "#1A1814", backgroundColor: "#FFFFFF", padding: 40 },
  header:      { marginBottom: 20 },
  headerTitle: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#1A1814", marginBottom: 4 },
  headerMeta:  { fontSize: 8, color: "#7A7570", marginBottom: 2 },
  headerPrep:  { fontSize: 7, color: "#A8A4A0" },
  divider:     { borderBottomWidth: 1, borderBottomColor: "#E0DDD8", marginVertical: 14 },
  statsRow:    { flexDirection: "row", gap: 8, marginBottom: 0 },
  statBox:     { flex: 1, backgroundColor: "#F2F0EB", padding: 10, borderRadius: 4 },
  statLabel:   { fontSize: 7, color: "#7A7570", fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  statValue:   { fontSize: 15, fontFamily: "Helvetica-Bold", color: "#1A1814" },
  statSub:     { fontSize: 7, color: "#A8A4A0", marginTop: 2 },
  secNum:      { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#1B4F6B", letterSpacing: 1, marginBottom: 2 },
  secTitle:    { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#1A1814", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  thRow:       { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#E0DDD8", paddingBottom: 5, marginBottom: 4 },
  tRow:        { flexDirection: "row", paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: "#E0DDD8" },
  tRowAlt:     { flexDirection: "row", paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: "#E0DDD8", backgroundColor: "#F2F0EB" },
  cSrc:        { flex: 3, fontSize: 8, color: "#1A1814" },
  cSrcHd:      { flex: 3, fontSize: 7, fontFamily: "Helvetica-Bold", color: "#7A7570", textTransform: "uppercase" },
  cNum:        { flex: 1.5, fontSize: 8, color: "#A8A4A0", textAlign: "right" },
  cNumHd:      { flex: 1.5, fontSize: 7, fontFamily: "Helvetica-Bold", color: "#7A7570", textTransform: "uppercase", textAlign: "right" },
  cGreen:      { flex: 1.5, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#1A6B4A", textAlign: "right" },
  cDelta:      { flex: 1.5, fontSize: 7, color: "#1A6B4A", textAlign: "right" },
  tlRow:       { flexDirection: "row", marginBottom: 10, gap: 10 },
  tlTime:      { width: 60, fontSize: 7, color: "#A8A4A0", textAlign: "right", paddingTop: 1 },
  tlDot:       { width: 8, height: 8, borderRadius: 4, marginTop: 1 },
  tlName:      { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#1A1814", marginBottom: 2 },
  tlDesc:      { fontSize: 8, color: "#7A7570", lineHeight: 1.4 },
  advRow:      { flexDirection: "row", gap: 8, marginBottom: 8 },
  advCard:     { flex: 1, backgroundColor: "#F2F0EB", padding: 10, borderRadius: 4 },
  advCardGreen:{ flex: 1, backgroundColor: "#D4EBE0", padding: 10, borderRadius: 4 },
  advLabel:    { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#7A7570", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  advAmt:      { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#1A6B4A", marginBottom: 3 },
  advNote:     { fontSize: 7, color: "#7A7570", lineHeight: 1.4 },
  recoupBox:   { backgroundColor: "#F2F0EB", padding: 10, borderRadius: 4, marginBottom: 6 },
  recoupLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#A8A4A0", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 },
  recoupText:  { fontSize: 8, color: "#7A7570", lineHeight: 1.5 },
  kvCols:      { flexDirection: "row", gap: 8 },
  kvCard:      { flex: 1, backgroundColor: "#F2F0EB", padding: 10, borderRadius: 4 },
  kvCardLbl:   { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#7A7570", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  kvRow:       { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#E0DDD8", paddingVertical: 4 },
  kvKey:       { fontSize: 8, color: "#A8A4A0" },
  kvVal:       { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#1A1814", textAlign: "right", flex: 1, marginLeft: 8 },
  sumRow:      { flexDirection: "row", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#E0DDD8" },
  sumDot:      { width: 8, height: 8, borderRadius: 4, marginTop: 1 },
  sumQ:        { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#1A1814", marginBottom: 2 },
  sumA:        { fontSize: 8, color: "#7A7570", lineHeight: 1.45 },
  sumBadge:    { fontSize: 7, color: "#1A6B4A" },
});

function MinimalPDF({ data }: { data: DealData }) {
  const d = buildDerived(data);
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={m.page}>
        {/* Header */}
        <View style={m.header}>
          <Text style={m.headerTitle}>{d.publisherLine} ×{d.artistName ? ` ${d.artistName}` : ""}</Text>
          <Text style={m.headerMeta}>{data.date ?? ""}{"  "}{data.status ? `· ${data.status}` : ""}</Text>
          <Text style={m.headerPrep}>Prepared by Good Problem Studios</Text>
        </View>
        <View style={m.divider} />

        {/* Key numbers */}
        <View style={m.statsRow}>
          {[
            { label: "Minimum Term",   value: d.yrs != null ? `${d.yrs} yrs` : "—",  sub: "Minimum administration period" },
            { label: "Total Advance",  value: usdK(d.totalAdv || null),               sub: usd(data.advance_initial_usd) + (data.advance_rollover_usd ? ` + ${usd(data.advance_rollover_usd)}` : "") },
            { label: "Royalty Range",  value: d.royRange,                             sub: "During term" },
            { label: "Catalog Return", value: "After term",                           sub: d.yrs != null ? `${d.yrs}+ yrs post-term` : "Post-term" },
          ].map(({ label, value, sub }) => (
            <View key={label} style={m.statBox}>
              <Text style={m.statLabel}>{label}</Text>
              <Text style={m.statValue}>{value}</Text>
              <Text style={m.statSub}>{sub}</Text>
            </View>
          ))}
        </View>
        <View style={m.divider} />

        {/* Royalty table */}
        <Text style={m.secNum}>01</Text>
        <Text style={m.secTitle}>Royalty Split</Text>
        {d.royalties.length > 0 ? (
          <View>
            <View style={m.thRow}>
              <Text style={m.cSrcHd}>Source</Text>
              <Text style={m.cNumHd}>During Term</Text>
              <Text style={m.cNumHd}>After Term</Text>
              <Text style={m.cNumHd}>Change</Text>
            </View>
            {d.royalties.map((row, i) => {
              const delta = row.post_term_pct - row.during_term_pct;
              return (
                <View key={i} style={i % 2 === 0 ? m.tRow : m.tRowAlt}>
                  <Text style={m.cSrc}>{cleanType(row.income_type)}</Text>
                  <Text style={m.cNum}>{pct(row.during_term_pct)}</Text>
                  <Text style={m.cGreen}>{pct(row.post_term_pct)}</Text>
                  <Text style={m.cDelta}>{delta > 0 ? `▲ +${delta}%` : delta < 0 ? `▼ ${delta}%` : "—"}</Text>
                </View>
              );
            })}
          </View>
        ) : <Text style={{ fontSize: 8, color: "#7A7570" }}>Royalties not parsed — review contract</Text>}
        <View style={m.divider} />

        {/* Timeline */}
        <Text style={m.secNum}>02</Text>
        <Text style={m.secTitle}>Deal Timeline</Text>
        {d.tlNodes.map((node, i) => (
          <View key={i} style={m.tlRow}>
            <Text style={m.tlTime}>{node.timeframe}</Text>
            <View style={[m.tlDot, { backgroundColor: node.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={m.tlName}>{node.label}</Text>
              <Text style={m.tlDesc}>{node.desc}</Text>
            </View>
          </View>
        ))}
        <View style={m.divider} />

        {/* Advances */}
        <Text style={m.secNum}>03</Text>
        <Text style={m.secTitle}>Advances & Recoupment</Text>
        <View style={m.advRow}>
          <View style={m.advCard}>
            <Text style={m.advLabel}>Initial Advance</Text>
            <Text style={m.advAmt}>{usd(data.advance_initial_usd)}</Text>
            {data.advance_initial_notes && <Text style={m.advNote}>{wLimit(data.advance_initial_notes, 15)}</Text>}
          </View>
          <View style={m.advCardGreen}>
            <Text style={m.advLabel}>Rollover Advance</Text>
            <Text style={m.advAmt}>{usd(data.advance_rollover_usd ?? null)}</Text>
            {data.advance_rollover_conditions && <Text style={m.advNote}>{wLimit(data.advance_rollover_conditions, 15)}</Text>}
          </View>
        </View>
        <View style={m.recoupBox}>
          <Text style={m.recoupLabel}>How recoupment works</Text>
          <Text style={m.recoupText}>Advances are recouped from your earned royalties over time. Once fully recouped, royalties flow to you directly.</Text>
        </View>
        <View style={m.divider} />

        {/* Scope & accounting */}
        <Text style={m.secNum}>04</Text>
        <Text style={m.secTitle}>Scope & Accounting</Text>
        <View style={m.kvCols}>
          <View style={m.kvCard}>
            <Text style={m.kvCardLbl}>Scope of Rights</Text>
            {d.scopeRows.map(({ k, v }) => (
              <View key={k} style={m.kvRow}>
                <Text style={m.kvKey}>{k}</Text>
                <Text style={m.kvVal}>{v}</Text>
              </View>
            ))}
          </View>
          <View style={m.kvCard}>
            <Text style={m.kvCardLbl}>Accounting & Audit</Text>
            {d.acctRows.map(({ k, v }) => (
              <View key={k} style={m.kvRow}>
                <Text style={m.kvKey}>{k}</Text>
                <Text style={m.kvVal}>{v}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={m.divider} />

        {/* Plain English */}
        <Text style={m.secNum}>05</Text>
        <Text style={m.secTitle}>Plain English Summary</Text>
        {d.summaryItems.map((item, i) => (
          <View key={i} style={m.sumRow}>
            <View style={[m.sumDot, { backgroundColor: item.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={m.sumQ}>{item.q}{"  "}<Text style={m.sumBadge}>{item.badge}</Text></Text>
              <Text style={m.sumA}>{item.a}</Text>
            </View>
          </View>
        ))}
      </Page>
    </Document>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// WRAPPED PDF
// ══════════════════════════════════════════════════════════════════════════════
// react-pdf color approximations (no rgba support):
//   rgba(255,255,255,0.35) on #0A0A0A → #585858
//   rgba(255,255,255,0.45) on #1A1814 → #6B6B6B
//   rgba(255,255,255,0.25) on #0F2318 → #4A5E52
//   rgba(255,255,255,0.08) on #1A1814 → #282422  (bar track)
//   rgba(0,0,0,0.4) on #C8F064        → #8A9A40

const w = StyleSheet.create({
  // Page bases
  pgCover:  { fontFamily: "Helvetica", backgroundColor: "#0A0A0A", padding: 48 },
  pgDark:   { fontFamily: "Helvetica", backgroundColor: "#1A1814", padding: 40 },
  pgGreen:  { fontFamily: "Helvetica", backgroundColor: "#0F2318", padding: 40 },
  pgLime:   { fontFamily: "Helvetica", backgroundColor: "#C8F064", padding: 48 },
  pgLight:  { fontFamily: "Helvetica", backgroundColor: "#F7F5F0", padding: 40 },

  // Cover
  coverLabel:  { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#585858", textTransform: "uppercase", letterSpacing: 1, marginBottom: 40 },
  coverPubl:   { fontSize: 32, fontFamily: "Helvetica-Bold", color: "#FFFFFF", lineHeight: 1.1, marginBottom: 0 },
  coverArtist: { fontSize: 32, fontFamily: "Helvetica-Bold", color: "#C8F064", lineHeight: 1.1, marginBottom: 20 },
  coverDate:   { fontSize: 10, color: "#585858", marginBottom: 8 },
  coverPill:   { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#585858", borderWidth: 1, borderColor: "#585858", borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start", marginBottom: 0 },
  coverGPS:    { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#585858", letterSpacing: 2, textTransform: "uppercase", marginTop: "auto" as unknown as number },

  // Stat page (dark)
  statLabel:   { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#585858", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 },
  statValue:   { fontSize: 28, fontFamily: "Helvetica-Bold", color: "#FFFFFF", marginBottom: 4 },
  statSub:     { fontSize: 8, color: "#585858" },
  statDivider: { width: 1, backgroundColor: "#2E2E2E", marginHorizontal: 24 },

  // Section label (used on dark pages)
  secLbl:  { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#C8F064", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  secIntro:{ fontSize: 11, color: "#6B6B6B", marginBottom: 24 },

  // Bar rows
  barRow:    { marginBottom: 16 },
  barMeta:   { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  barType:   { fontSize: 9, color: "#6B6B6B" },
  barPct:    { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#C8F064" },
  barTrack:  { height: 8, backgroundColor: "#282422", borderRadius: 4, overflow: "hidden" },
  barFill:   { height: 8, backgroundColor: "#C8F064", borderRadius: 4 },
  barSub:    { fontSize: 7, color: "#585858", marginTop: 4 },

  // Timeline (dark green)
  tlRow:   { flexDirection: "row", gap: 10, marginBottom: 14 },
  tlTime:  { width: 70, fontSize: 7, color: "#4A5E52", textAlign: "right", paddingTop: 1 },
  tlDot:   { width: 8, height: 8, borderRadius: 4, marginTop: 1 },
  tlName:  { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#FFFFFF", marginBottom: 2 },
  tlDesc:  { fontSize: 8, color: "#4A5E52", lineHeight: 1.45 },

  // Advance page (lime)
  advLbl:    { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#8A9A40", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  advIntro:  { fontSize: 13, color: "#0A0A0A", marginBottom: 10 },
  advBig:    { fontSize: 72, fontFamily: "Helvetica-Bold", color: "#0A0A0A", lineHeight: 1, marginBottom: 6 },
  advNote:   { fontSize: 9, color: "#8A9A40", marginBottom: 20 },
  advCard:   { backgroundColor: "#B8DC54", borderRadius: 8, padding: 16 },
  advCardAmt:{ fontSize: 22, fontFamily: "Helvetica-Bold", color: "#0A0A0A", marginBottom: 4 },
  advCardSub:{ fontSize: 8, color: "#8A9A40" },

  // Plain English (light)
  peSecLbl:  { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#A8A4A0", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  peIntro:   { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#1A1814", marginBottom: 20 },
  peRow:     { flexDirection: "row", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#E0DDD8" },
  peDot:     { width: 8, height: 8, borderRadius: 4, marginTop: 2 },
  peQ:       { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#1A1814", marginBottom: 3 },
  peA:       { fontSize: 8, color: "#7A7570", lineHeight: 1.45 },
  peBadge:   { fontSize: 7, color: "#1A6B4A" },
});

const BADGE_COLORS: Record<string, string> = {
  Critical:   "#B05C1A",
  High:       "#1A6B4A",
  Supporting: "#6B6560",
  Context:    "#6B6560",
};

function WrappedPDF({ data }: { data: DealData }) {
  const d = buildDerived(data);
  const BAR_MAX_WIDTH = 400; // points available for bars

  return (
    <Document>

      {/* PAGE 1 — COVER */}
      <Page size="A4" style={w.pgCover}>
        <Text style={w.coverLabel}>GPS</Text>
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Text style={w.coverPubl}>Good Problem Studios ×</Text>
          {d.artistName && <Text style={w.coverArtist}>{d.artistName}</Text>}
          {data.date && <Text style={w.coverDate}>{data.date}</Text>}
          {data.status && <Text style={w.coverPill}>{data.status}</Text>}
        </View>
        <Text style={w.coverGPS}>Good Problem Studios</Text>
      </Page>

      {/* PAGE 2 — KEY NUMBERS */}
      <Page size="A4" orientation="landscape" style={w.pgDark}>
        <Text style={w.secLbl}>Key Numbers</Text>
        <View style={{ flexDirection: "row", flex: 1, alignItems: "center" }}>
          {[
            { label: "Minimum term",  value: d.yrs != null ? `${d.yrs} yrs` : "—",  sub: "Administration period" },
            { label: "Total advance", value: usdK(d.totalAdv || null),               sub: "Signing + rollover"     },
            { label: "Royalty range", value: d.royRange,                             sub: "During term"            },
          ].map(({ label, value, sub }, i) => (
            <React.Fragment key={label}>
              {i > 0 && <View style={w.statDivider} />}
              <View style={{ flex: 1 }}>
                <Text style={w.statLabel}>{label}</Text>
                <Text style={w.statValue}>{value}</Text>
                <Text style={w.statSub}>{sub}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </Page>

      {/* PAGE 3 — ROYALTY SPLIT */}
      <Page size="A4" orientation="landscape" style={w.pgDark}>
        <Text style={w.secLbl}>Your Cut</Text>
        <Text style={w.secIntro}>Every dollar collected. Here's the split.</Text>
        {d.royalties.map((row, i) => {
          const fillW = Math.round((row.during_term_pct / 100) * BAR_MAX_WIDTH);
          const delta = row.post_term_pct - row.during_term_pct;
          return (
            <View key={i} style={w.barRow}>
              <View style={w.barMeta}>
                <Text style={w.barType}>{cleanType(row.income_type)}</Text>
                <Text style={w.barPct}>{row.during_term_pct}%</Text>
              </View>
              <View style={w.barTrack}>
                <View style={[w.barFill, { width: fillW }]} />
              </View>
              {delta !== 0 && (
                <Text style={w.barSub}>
                  {delta > 0 ? `+${delta}% after term` : `${delta}% after term`}
                </Text>
              )}
            </View>
          );
        })}
        {d.royalties.length === 0 && (
          <Text style={{ fontSize: 9, color: "#585858" }}>Royalties not parsed — review contract</Text>
        )}
      </Page>

      {/* PAGE 4 — TIMELINE */}
      <Page size="A4" style={w.pgGreen}>
        <Text style={w.secLbl}>How It Unfolds</Text>
        <Text style={w.secIntro}>A clear map of where this deal goes.</Text>
        {d.tlNodes.map((node, i) => (
          <View key={i} style={w.tlRow}>
            <Text style={w.tlTime}>{node.timeframe}</Text>
            <View style={[w.tlDot, { backgroundColor: node.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={w.tlName}>{node.label}</Text>
              <Text style={w.tlDesc}>{node.desc}</Text>
            </View>
          </View>
        ))}
      </Page>

      {/* PAGE 5 — ADVANCES */}
      <Page size="A4" style={w.pgLime}>
        <Text style={w.advLbl}>The Advance</Text>
        <Text style={w.advIntro}>On signing, this is yours.</Text>
        <Text style={w.advBig}>{usdK(data.advance_initial_usd)}</Text>
        {data.advance_initial_notes && (
          <Text style={w.advNote}>{wLimit(data.advance_initial_notes, 15)}</Text>
        )}
        {data.advance_rollover_usd && (
          <View style={w.advCard}>
            <Text style={w.advCardAmt}>+ {usdK(data.advance_rollover_usd)}</Text>
            {data.advance_rollover_conditions && (
              <Text style={w.advCardSub}>{wLimit(data.advance_rollover_conditions, 15)}</Text>
            )}
          </View>
        )}
      </Page>

      {/* PAGE 6 — PLAIN ENGLISH */}
      <Page size="A4" style={w.pgLight}>
        <Text style={w.peSecLbl}>Plain English</Text>
        <Text style={w.peIntro}>The 7 things that matter most.</Text>
        {d.summaryItems.map((item, i) => (
          <View key={i} style={w.peRow}>
            <View style={[w.peDot, { backgroundColor: item.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={w.peQ}>
                {item.q}{"  "}
                <Text style={[w.peBadge, { color: BADGE_COLORS[item.badge] ?? "#6B6560" }]}>{item.badge}</Text>
              </Text>
              <Text style={w.peA}>{item.a}</Text>
            </View>
          </View>
        ))}
      </Page>

    </Document>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ══════════════════════════════════════════════════════════════════════════════
interface Props {
  data: DealData;
  mode: "minimal" | "wrapped";
}

export default function DealSummaryPDF({ data, mode }: Props) {
  return mode === "wrapped" ? <WrappedPDF data={data} /> : <MinimalPDF data={data} />;
}
