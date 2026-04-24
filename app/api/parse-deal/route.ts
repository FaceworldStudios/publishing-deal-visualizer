import { NextRequest, NextResponse } from "next/server";
import { parseDealWithClaude } from "@/lib/claude";
import { saveDeal, shortId } from "@/lib/store";
import { extractTextFromPdf } from "@/lib/pdf-extract";

// Allow up to 120s for large PDFs + Claude response
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";

    let text: string;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") as File | null;
      const pastedText = form.get("text") as string | null;

      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        try {
          text = await extractTextFromPdf(buffer);
        } catch (pdfErr) {
          const pdfMsg = pdfErr instanceof Error ? pdfErr.message : String(pdfErr);
          console.error("[pdf-extract error]", pdfMsg);
          return NextResponse.json(
            { error: `PDF extraction failed: ${pdfMsg}` },
            { status: 422 }
          );
        }
      } else if (pastedText && pastedText.trim().length > 0) {
        text = pastedText.trim();
      } else {
        return NextResponse.json(
          { error: "No file or text provided." },
          { status: 400 }
        );
      }
    } else {
      const body = (await req.json()) as { text?: string };
      if (!body.text || body.text.trim().length === 0) {
        return NextResponse.json(
          { error: "No text provided." },
          { status: 400 }
        );
      }
      text = body.text.trim();
    }

    const dealData = await parseDealWithClaude(text);

    // Validate required fields
    const missing: string[] = [];
    if (dealData.advance_initial_usd === null) missing.push("advance_initial_usd");
    if (dealData.term_years === null) missing.push("term_years");
    if (!dealData.royalties || dealData.royalties.length === 0)
      missing.push("royalties");

    const id = shortId();
    await saveDeal({ id, created_at: new Date().toISOString(), data: dealData });

    return NextResponse.json({ id, data: dealData, missing_fields: missing });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : "";
    console.error("[parse-deal error]", message, stack);
    return NextResponse.json(
      { error: `Failed to parse contract: ${message}` },
      { status: 500 }
    );
  }
}
