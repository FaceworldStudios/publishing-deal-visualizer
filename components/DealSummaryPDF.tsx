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
function wLimit(s: string | null | undefined, n: number): string | null {
  if (!s || s.trim() === "" || s === "—") return null;
  return s.trim().split(/\s+/).slice(0, n).join(" ");
}

// ── Derived data builder ──────────────────────────────────────────────────────
interface TLNode { label: string; timeframe: string; desc: string; color: string }
interface KV { k: string; v: string }
interface SumItem { q: string; a: string; color: string }

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

  // Timeline nodes — only include ones with real content
  const rawNodes: Array<TLNode | null> = [
    { label: "Signing", timeframe: data.date ?? "—", desc: "Deal becomes effective. Rights transfer begins.", color: "#1B4F6B" },
    data.advance_rollover_conditions ? { label: "Rollover Window", timeframe: "—", desc: wLimit(data.advance_rollover_conditions, 25) ?? "", color: "#1A6B4A" } : null,
    data.early_exit ? { label: "Early Exit", timeframe: "—", desc: wLimit(data.early_exit, 25) ?? "", color: "#6B6560" } : null,
    (data.renewal_terms || data.term_notes)
      ? { label: data.renewal_terms ? "Renewal Window" : "Royalties Improve", timeframe: yrs != null ? `After year ${yrs}` : "—", desc: wLimit(data.renewal_terms ?? data.term_notes, 25) ?? "", color: "#B05C1A" }
      : null,
    data.catalog_reversion ? { label: "Catalog Return", timeframe: "—", desc: wLimit(data.catalog_reversion, 25) ?? "", color: "#A8A4A0" } : null,
  ];
  const tlNodes: TLNode[] = rawNodes.filter((n): n is TLNode => n !== null);

  const scopeRows: KV[] = [
    data.scope_existing        ? { k: "Existing catalog",      v: "All songs before signing" } : null,
    data.scope_new             ? { k: "New compositions",      v: "All songs during deal" } : null,
    data.territory             ? { k: "Territory",             v: data.territory.toLowerCase().includes("world") ? "Worldwide" : (wLimit(data.territory, 4) ?? data.territory) } : null,
    data.unexploited_reversion ? { k: "Unexploited reversion", v: "Returns one year after term" } : null,
  ].filter((r): r is KV => r !== null);

  const acctRows: KV[] = [
    data.accounting_frequency        ? { k: "Statements",        v: data.accounting_frequency } : null,
    data.accounting_days != null     ? { k: "Days after period", v: `${data.accounting_days} days` } : null,
    data.pipeline_calc_available != null ? { k: "Pipeline calc", v: data.pipeline_calc_available ? "Available" : "Not available" } : null,
    data.audit_rights ? { k: "Audit rights", v: wLimit(data.audit_rights, 5) ?? "" } : null,
  ].filter((r): r is KV => r !== null);

  // Plain English answers — null if no data
  const royaltyList = data.artist_share_pct != null
    ? `${data.artist_share_pct}% of net receipts.`
    : royalties.length
      ? royalties.map(r => `${cleanType(r.income_type)}: ${r.during_term_pct}%`).join("  ·  ")
      : null;

  const advanceAnswer = data.advance_initial_usd
    ? wLimit([
        data.recoupment_structure
          ? `${usd(data.advance_initial_usd)}${data.advance_initial_notes ? " — " + data.advance_initial_notes : " guaranteed spend on this deal."}`
          : `${usd(data.advance_initial_usd)} upfront at signing.`,
        data.advance_rollover_usd ? `Additional ${usd(data.advance_rollover_usd)} available if advances recouped within term.` : null,
      ].filter(Boolean).join(" "), 30)
    : null;

  const returnAnswer = yrs != null
    ? wLimit(
        data.renewal_terms
          ? `At the end of the ${yrs}-year license period, unless renewed.`
          : `No earlier than ${yrs} years from signing, once all advances are fully recouped.`,
        30,
      )
    : null;

  const exitAnswer = data.early_exit ? wLimit(data.early_exit, 30) : null;

  const trendAnswer = afterAvg > duringAvg
    ? `Yes — rises from ${duringAvg}% to ${afterAvg}% on average once the term ends.`
    : afterAvg < duringAvg
      ? "Rates vary by income type. See the royalty breakdown above."
      : null;

  const scopeParts = [
    data.scope_existing ? "Existing catalog: all songs written before signing." : null,
    data.scope_new      ? "New songs: everything written during the deal." : null,
  ].filter(Boolean);
  const scopeAnswer = scopeParts.length ? wLimit(scopeParts.join(" "), 30) : null;

  const payParts = [
    data.accounting_frequency ? `${data.accounting_frequency} statements` : null,
    data.accounting_days      ? `${data.accounting_days} days after each period` : null,
  ].filter(Boolean);
  const payAnswer = payParts.length ? wLimit(payParts.join(". ") + ".", 30) : null;

  const summaryItems: SumItem[] = [
    { q: "What % do I earn right now?",     a: royaltyList,   color: "#1B4F6B" },
    { q: "How much money upfront?",         a: advanceAnswer, color: "#1A6B4A" },
    { q: "When do I get my music back?",    a: returnAnswer,  color: "#1A6B4A" },
    { q: "What does early exit cost?",      a: exitAnswer,    color: "#6B6560" },
    { q: "Does my rate improve over time?", a: trendAnswer,   color: "#1A6B4A" },
    { q: "Which songs are covered?",        a: scopeAnswer,   color: "#6B6560" },
    { q: "How often do I get paid?",        a: payAnswer,     color: "#6B6560" },
  ].filter((item): item is SumItem => !!item.a);

  // Adaptive quickstats
  const termLabel = data.renewal_terms ? "License Period" : "Minimum Term";
  const advanceLabel = data.recoupment_structure ? "Funding" : "Total Advance";
  const shareQuickstat = data.artist_share_pct != null
    ? { label: "Your Share", value: `${data.artist_share_pct}%`, sub: "Of net receipts" }
    : { label: "Royalty Range", value: royRange, sub: afterAvg !== duringAvg ? "During term" : "Of net receipts" };

  return {
    royalties, yrs, totalAdv, publisherLine, artistName, royRange,
    duringAvg, afterAvg, tlNodes, scopeRows, acctRows, summaryItems,
    termLabel, advanceLabel, shareQuickstat,
  };
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
});

function MinimalPDF({ data }: { data: DealData }) {
  const d = buildDerived(data);
  const hasScopeOrAcct = d.scopeRows.length > 0 || d.acctRows.length > 0;
  const showAfterTerm = d.afterAvg !== d.duringAvg;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={m.page}>
        {/* Header */}
        <View style={m.header}>
          <Text style={m.headerTitle}>{d.publisherLine} ×{d.artistName ? ` ${d.artistName}` : ""}</Text>
          {(data.date || data.status) && (
            <Text style={m.headerMeta}>{data.date ?? ""}{data.status ? `  ·  ${data.status}` : ""}</Text>
          )}
          <Text style={m.headerPrep}>Prepared by Good Problem Studios</Text>
        </View>
        <View style={m.divider} />

        {/* Key numbers */}
        <View style={m.statsRow}>
          {[
            d.yrs != null ? { label: d.termLabel, value: `${d.yrs} yrs`, sub: data.renewal_terms ? "Rolling renewal after" : "Minimum administration period" } : null,
            d.totalAdv > 0 ? { label: d.advanceLabel, value: usdK(d.totalAdv), sub: usd(data.advance_initial_usd) + (data.advance_rollover_usd ? ` + ${usd(data.advance_rollover_usd)}` : "") } : null,
            { label: d.shareQuickstat.label, value: d.shareQuickstat.value, sub: d.shareQuickstat.sub },
          ].filter((s): s is { label: string; value: string; sub: string } => s !== null).map(({ label, value, sub }) => (
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
              {showAfterTerm ? (
                <>
                  <Text style={m.cNumHd}>During Term</Text>
                  <Text style={m.cNumHd}>After Term</Text>
                  <Text style={m.cNumHd}>Change</Text>
                </>
              ) : (
                <Text style={m.cNumHd}>Share</Text>
              )}
            </View>
            {d.royalties.map((row, i) => {
              const delta = row.post_term_pct - row.during_term_pct;
              return (
                <View key={i} style={i % 2 === 0 ? m.tRow : m.tRowAlt}>
                  <Text style={m.cSrc}>{cleanType(row.income_type)}</Text>
                  {showAfterTerm ? (
                    <>
                      <Text style={m.cNum}>{pct(row.during_term_pct)}</Text>
                      <Text style={m.cGreen}>{pct(row.post_term_pct)}</Text>
                      <Text style={m.cDelta}>{delta > 0 ? `+${delta}%` : delta < 0 ? `${delta}%` : "—"}</Text>
                    </>
                  ) : (
                    <Text style={m.cGreen}>{pct(row.during_term_pct)}</Text>
                  )}
                </View>
              );
            })}
          </View>
        ) : <Text style={{ fontSize: 8, color: "#7A7570" }}>Royalties not parsed — review contract</Text>}

        {/* Timeline */}
        {d.tlNodes.length > 0 && (
          <>
            <View style={m.divider} />
            <Text style={m.secNum}>02</Text>
            <Text style={m.secTitle}>Deal Timeline</Text>
            {d.tlNodes.map((node, i) => (
              <View key={i} style={m.tlRow}>
                <Text style={m.tlTime}>{node.timeframe !== "—" ? node.timeframe : ""}</Text>
                <View style={[m.tlDot, { backgroundColor: node.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={m.tlName}>{node.label}</Text>
                  <Text style={m.tlDesc}>{node.desc}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Advances */}
        {data.advance_initial_usd ? (
          <>
            <View style={m.divider} />
            <Text style={m.secNum}>03</Text>
            <Text style={m.secTitle}>{data.recoupment_structure ? "Funding & Recoupment" : "Advances & Recoupment"}</Text>
            <View style={m.advRow}>
              <View style={m.advCard}>
                <Text style={m.advLabel}>{data.recoupment_structure ? "Funding" : "Initial Advance"}</Text>
                <Text style={m.advAmt}>{usd(data.advance_initial_usd)}</Text>
                {data.advance_initial_notes && <Text style={m.advNote}>{wLimit(data.advance_initial_notes, 15) ?? ""}</Text>}
              </View>
              {data.advance_rollover_usd ? (
                <View style={m.advCardGreen}>
                  <Text style={m.advLabel}>Rollover Advance</Text>
                  <Text style={m.advAmt}>{usd(data.advance_rollover_usd)}</Text>
                  {data.advance_rollover_conditions && <Text style={m.advNote}>{wLimit(data.advance_rollover_conditions, 15) ?? ""}</Text>}
                </View>
              ) : null}
            </View>
            <View style={m.recoupBox}>
              <Text style={m.recoupLabel}>How recoupment works</Text>
              <Text style={m.recoupText}>
                {data.recoupment_structure ?? "Advances are recouped from your earned royalties over time. Once fully recouped, royalties flow to you directly."}
              </Text>
            </View>
          </>
        ) : null}

        {/* Scope & accounting */}
        {hasScopeOrAcct && (
          <>
            <View style={m.divider} />
            <Text style={m.secNum}>04</Text>
            <Text style={m.secTitle}>
              {d.scopeRows.length && d.acctRows.length ? "Scope & Accounting" : d.scopeRows.length ? "Scope" : "Accounting"}
            </Text>
            <View style={m.kvCols}>
              {d.scopeRows.length > 0 && (
                <View style={m.kvCard}>
                  <Text style={m.kvCardLbl}>Scope of Rights</Text>
                  {d.scopeRows.map(({ k, v }) => (
                    <View key={k} style={m.kvRow}>
                      <Text style={m.kvKey}>{k}</Text>
                      <Text style={m.kvVal}>{v}</Text>
                    </View>
                  ))}
                </View>
              )}
              {d.acctRows.length > 0 && (
                <View style={m.kvCard}>
                  <Text style={m.kvCardLbl}>Accounting & Audit</Text>
                  {d.acctRows.map(({ k, v }) => (
                    <View key={k} style={m.kvRow}>
                      <Text style={m.kvKey}>{k}</Text>
                      <Text style={m.kvVal}>{v}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        {/* Plain English */}
        {d.summaryItems.length > 0 && (
          <>
            <View style={m.divider} />
            <Text style={m.secNum}>05</Text>
            <Text style={m.secTitle}>Plain English Summary</Text>
            {d.summaryItems.map((item, i) => (
              <View key={i} style={m.sumRow}>
                <View style={[m.sumDot, { backgroundColor: item.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={m.sumQ}>{item.q}</Text>
                  <Text style={m.sumA}>{item.a}</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </Page>
    </Document>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// WRAPPED PDF
// ══════════════════════════════════════════════════════════════════════════════
const w = StyleSheet.create({
  pgCover:  { fontFamily: "Helvetica", backgroundColor: "#0A0A0A", padding: 48 },
  pgDark:   { fontFamily: "Helvetica", backgroundColor: "#1A1814", padding: 40 },
  pgGreen:  { fontFamily: "Helvetica", backgroundColor: "#0F2318", padding: 40 },
  pgLime:   { fontFamily: "Helvetica", backgroundColor: "#C8F064", padding: 48 },
  pgPurple: { fontFamily: "Helvetica", backgroundColor: "#1A0F28", padding: 48 },
  pgLight:  { fontFamily: "Helvetica", backgroundColor: "#F7F5F0", padding: 40 },

  coverLabel:  { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#585858", textTransform: "uppercase", letterSpacing: 1, marginBottom: 40 },
  coverPubl:   { fontSize: 32, fontFamily: "Helvetica-Bold", color: "#FFFFFF", lineHeight: 1.1, marginBottom: 0 },
  coverArtist: { fontSize: 32, fontFamily: "Helvetica-Bold", color: "#C8F064", lineHeight: 1.1, marginBottom: 20 },
  coverDate:   { fontSize: 10, color: "#585858", marginBottom: 8 },
  coverPill:   { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#585858", borderWidth: 1, borderColor: "#585858", borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start", marginBottom: 0 },
  coverGPS:    { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#585858", letterSpacing: 2, textTransform: "uppercase", marginTop: "auto" as unknown as number },

  statLabel:   { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#585858", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 },
  statValue:   { fontSize: 28, fontFamily: "Helvetica-Bold", color: "#FFFFFF", marginBottom: 4 },
  statSub:     { fontSize: 8, color: "#585858" },
  statDivider: { width: 1, backgroundColor: "#2E2E2E", marginHorizontal: 24 },

  secLbl:  { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#C8F064", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  secIntro:{ fontSize: 11, color: "#6B6B6B", marginBottom: 24 },

  barRow:    { marginBottom: 16 },
  barMeta:   { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  barType:   { fontSize: 9, color: "#6B6B6B" },
  barPct:    { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#C8F064" },
  barTrack:  { height: 8, backgroundColor: "#282422", borderRadius: 4, overflow: "hidden" },
  barFill:   { height: 8, backgroundColor: "#C8F064", borderRadius: 4 },
  barSub:    { fontSize: 7, color: "#585858", marginTop: 4 },

  tlRow:   { flexDirection: "row", gap: 10, marginBottom: 14 },
  tlTime:  { width: 70, fontSize: 7, color: "#4A5E52", textAlign: "right", paddingTop: 1 },
  tlDot:   { width: 8, height: 8, borderRadius: 4, marginTop: 1 },
  tlName:  { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#FFFFFF", marginBottom: 2 },
  tlDesc:  { fontSize: 8, color: "#4A5E52", lineHeight: 1.45 },

  advLbl:    { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#8A9A40", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  advIntro:  { fontSize: 13, color: "#0A0A0A", marginBottom: 10 },
  advBig:    { fontSize: 72, fontFamily: "Helvetica-Bold", color: "#0A0A0A", lineHeight: 1, marginBottom: 6 },
  advNote:   { fontSize: 9, color: "#8A9A40", marginBottom: 20 },
  advCard:   { backgroundColor: "#B8DC54", borderRadius: 8, padding: 16 },
  advCardAmt:{ fontSize: 22, fontFamily: "Helvetica-Bold", color: "#0A0A0A", marginBottom: 4 },
  advCardSub:{ fontSize: 8, color: "#8A9A40" },

  termLbl:   { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#585858", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  termIntro: { fontSize: 12, color: "#A896B0", marginBottom: 10 },
  termBig:   { fontSize: 72, fontFamily: "Helvetica-Bold", color: "#FFFFFF", lineHeight: 1 },
  termUnit:  { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#5B4880", marginBottom: 24 },
  termNote:  { fontSize: 9, color: "#A896B0", lineHeight: 1.6, borderWidth: 1, borderColor: "#2E2138", borderRadius: 8, padding: 16, backgroundColor: "#241840" },

  peSecLbl:  { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#A8A4A0", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  peIntro:   { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#1A1814", marginBottom: 20 },
  peRow:     { flexDirection: "row", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#E0DDD8" },
  peDot:     { width: 8, height: 8, borderRadius: 4, marginTop: 2 },
  peQ:       { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#1A1814", marginBottom: 3 },
  peA:       { fontSize: 8, color: "#7A7570", lineHeight: 1.45 },
});

function WrappedPDF({ data }: { data: DealData }) {
  const d = buildDerived(data);
  const BAR_MAX_WIDTH = 400;
  const showAfterTerm = d.afterAvg !== d.duringAvg;

  return (
    <Document>

      {/* PAGE 1 — COVER */}
      <Page size="A4" style={w.pgCover}>
        <Text style={w.coverLabel}>Good Problem Studios</Text>
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Text style={w.coverPubl}>{d.publisherLine} ×</Text>
          {d.artistName && <Text style={w.coverArtist}>{d.artistName}</Text>}
          {data.date && <Text style={w.coverDate}>{data.date}</Text>}
          {data.status && <Text style={w.coverPill}>{data.status}</Text>}
        </View>
      </Page>

      {/* PAGE 2 — KEY NUMBERS */}
      <Page size="A4" orientation="landscape" style={w.pgDark}>
        <Text style={w.secLbl}>Key Numbers</Text>
        <View style={{ flexDirection: "row", flex: 1, alignItems: "center" }}>
          {[
            d.yrs != null ? { label: d.termLabel, value: `${d.yrs} yrs`, sub: data.renewal_terms ? "Rolling renewal after" : "Administration period" } : null,
            d.totalAdv > 0 ? { label: d.advanceLabel, value: usdK(d.totalAdv), sub: data.advance_rollover_usd ? "Signing + rollover" : "On signing" } : null,
            { label: d.shareQuickstat.label, value: d.shareQuickstat.value, sub: d.shareQuickstat.sub },
          ].filter((s): s is { label: string; value: string; sub: string } => s !== null).map(({ label, value, sub }, i) => (
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
      {d.royalties.length > 0 && (
        <Page size="A4" orientation="landscape" style={w.pgDark}>
          <Text style={w.secLbl}>Your Cut</Text>
          <Text style={w.secIntro}>Every dollar collected. Here&apos;s the split.</Text>
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
                {showAfterTerm && delta !== 0 && (
                  <Text style={w.barSub}>
                    {delta > 0 ? `+${delta}% after term` : `${delta}% after term`}
                  </Text>
                )}
              </View>
            );
          })}
        </Page>
      )}

      {/* PAGE 4 — TIMELINE */}
      {d.tlNodes.length > 0 && (
        <Page size="A4" style={w.pgGreen}>
          <Text style={w.secLbl}>How It Unfolds</Text>
          <Text style={w.secIntro}>A clear map of where this deal goes.</Text>
          {d.tlNodes.map((node, i) => (
            <View key={i} style={w.tlRow}>
              <Text style={w.tlTime}>{node.timeframe !== "—" ? node.timeframe : ""}</Text>
              <View style={[w.tlDot, { backgroundColor: node.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={w.tlName}>{node.label}</Text>
                <Text style={w.tlDesc}>{node.desc}</Text>
              </View>
            </View>
          ))}
        </Page>
      )}

      {/* PAGE 5 — ADVANCE / FUNDING */}
      {data.advance_initial_usd ? (
        <Page size="A4" style={w.pgLime}>
          <Text style={w.advLbl}>{data.recoupment_structure ? "Funding" : "The Advance"}</Text>
          <Text style={w.advIntro}>{data.recoupment_structure ? "Guaranteed spend on this deal." : "On signing, this is yours."}</Text>
          <Text style={w.advBig}>{usdK(data.advance_initial_usd)}</Text>
          {data.advance_initial_notes && (
            <Text style={w.advNote}>{wLimit(data.advance_initial_notes, 15) ?? ""}</Text>
          )}
          {data.advance_rollover_usd ? (
            <View style={w.advCard}>
              <Text style={w.advCardAmt}>+ {usdK(data.advance_rollover_usd)}</Text>
              {data.advance_rollover_conditions && (
                <Text style={w.advCardSub}>{wLimit(data.advance_rollover_conditions, 15) ?? ""}</Text>
              )}
            </View>
          ) : null}
        </Page>
      ) : null}

      {/* PAGE 6 — THE TERM */}
      {d.yrs != null && (
        <Page size="A4" style={w.pgPurple}>
          <Text style={w.termLbl}>{data.renewal_terms ? "License Period" : "The Term"}</Text>
          <Text style={w.termIntro}>{data.renewal_terms ? "How long this deal runs." : "Minimum time your music is administered."}</Text>
          <Text style={w.termBig}>{d.yrs}</Text>
          <Text style={w.termUnit}>{data.renewal_terms ? "year license" : "years minimum"}</Text>
          {(data.renewal_terms || data.term_notes) && (
            <Text style={w.termNote}>{wLimit(data.renewal_terms ?? data.term_notes, 40) ?? ""}</Text>
          )}
        </Page>
      )}

      {/* PAGE 7 — PLAIN ENGLISH */}
      {d.summaryItems.length > 0 && (
        <Page size="A4" style={w.pgLight}>
          <Text style={w.peSecLbl}>Plain English</Text>
          <Text style={w.peIntro}>The things that matter most.</Text>
          {d.summaryItems.map((item, i) => (
            <View key={i} style={w.peRow}>
              <View style={[w.peDot, { backgroundColor: item.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={w.peQ}>{item.q}</Text>
                <Text style={w.peA}>{item.a}</Text>
              </View>
            </View>
          ))}
        </Page>
      )}

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
