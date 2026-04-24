import fs from "fs";
import path from "path";
import crypto from "crypto";
import { put, head } from "@vercel/blob";
import { StoredDeal } from "./types";

// In production on Vercel we use Blob storage (short, shareable URLs).
// In local dev with no BLOB_READ_WRITE_TOKEN, we fall back to a JSON file
// at data/deals.json so `npm run dev` keeps working without Blob setup.

const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;
const LOCAL_DATA_DIR = path.join(process.cwd(), "data");
const LOCAL_DATA_FILE = path.join(LOCAL_DATA_DIR, "deals.json");
const BLOB_PREFIX = "deals/";

/**
 * Generate a short URL-safe slug (~6 chars, 32 bits of entropy).
 * Collision probability is negligible for this use case.
 */
export function shortId(): string {
  return crypto.randomBytes(4).toString("base64url").replace(/[-_]/g, "").slice(0, 6);
}

// ── Local fs helpers (dev only) ──────────────────────────────────────────────
function ensureLocalFile() {
  if (!fs.existsSync(LOCAL_DATA_DIR)) fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
  if (!fs.existsSync(LOCAL_DATA_FILE)) fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify({}), "utf-8");
}
function readLocal(): Record<string, StoredDeal> {
  ensureLocalFile();
  return JSON.parse(fs.readFileSync(LOCAL_DATA_FILE, "utf-8"));
}
function writeLocal(deals: Record<string, StoredDeal>) {
  ensureLocalFile();
  fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(deals, null, 2), "utf-8");
}

// ── Public API ───────────────────────────────────────────────────────────────
export async function saveDeal(deal: StoredDeal): Promise<void> {
  if (USE_BLOB) {
    await put(`${BLOB_PREFIX}${deal.id}.json`, JSON.stringify(deal), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return;
  }
  const deals = readLocal();
  deals[deal.id] = deal;
  writeLocal(deals);
}

export async function getDeal(id: string): Promise<StoredDeal | null> {
  if (USE_BLOB) {
    try {
      const meta = await head(`${BLOB_PREFIX}${id}.json`);
      const res = await fetch(meta.url, { cache: "no-store" });
      if (!res.ok) return null;
      return (await res.json()) as StoredDeal;
    } catch {
      return null;
    }
  }
  const deals = readLocal();
  return deals[id] ?? null;
}
