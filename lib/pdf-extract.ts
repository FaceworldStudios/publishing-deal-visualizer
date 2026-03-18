export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // pdf-parse v1 runs a self-test on require() that looks for a file relative
  // to the package root — suppress that by requiring the internal lib directly.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse/lib/pdf-parse.js");
  const result = await pdfParse(buffer);
  return result.text as string;
}
