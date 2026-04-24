import { NextRequest, NextResponse } from "next/server";
import { getDeal } from "@/lib/store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deal = await getDeal(id);
  if (!deal) {
    return NextResponse.json({ error: "Deal not found." }, { status: 404 });
  }

  const host = req.headers.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const printUrl = `${protocol}://${host}/deal/${id}/print`;

  // Import puppeteer dynamically to avoid issues if not installed
  let puppeteer;
  try {
    puppeteer = await import("puppeteer");
  } catch {
    return NextResponse.json(
      { error: "Puppeteer not available." },
      { status: 500 }
    );
  }

  const browser = await puppeteer.default.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.goto(printUrl, { waitUntil: "networkidle0", timeout: 30000 });

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: { top: "12mm", bottom: "12mm", left: "12mm", right: "12mm" },
    });

    const artistSlug = (deal.data.deal_title ?? "deal")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${artistSlug}-deal-summary.pdf"`,
      },
    });
  } finally {
    await browser.close();
  }
}
