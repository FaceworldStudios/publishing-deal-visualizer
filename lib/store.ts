import fs from "fs";
import path from "path";
import { StoredDeal } from "./types";

const DATA_DIR = process.env.VERCEL ? "/tmp/deals" : path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "deals.json");

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({}), "utf-8");
  }
}

function readAll(): Record<string, StoredDeal> {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

function writeAll(deals: Record<string, StoredDeal>) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(deals, null, 2), "utf-8");
}

export function saveDeal(deal: StoredDeal): void {
  const deals = readAll();
  deals[deal.id] = deal;
  writeAll(deals);
}

export function getDeal(id: string): StoredDeal | null {
  const deals = readAll();
  return deals[id] ?? null;
}
